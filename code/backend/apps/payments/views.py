import json
import logging

from django.conf import settings
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.sellers.models import SellerSubscription

from .models import Payment, PaymentSettings
from .serializers import InitiatePaymentSerializer, PaymentSerializer
from .services import (
    FEDAPAY_TRANSACTION_STATUS_MAP,
    FedaPayClient,
    FedaPayError,
    apply_payment_status,
    signal_payment_failure,
    start_fedapay_transaction,
    verify_webhook_signature,
)
from apps.sellers.services import apply_subscription_status

logger = logging.getLogger(__name__)


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """Consultation des paiements : le client authentifié consulte ses
    propres paiements (via ses commandes, pour suivre l'état pendant le
    paiement au checkout) ; le staff voit tout (dashboard admin)."""

    queryset = Payment.objects.all().select_related("order")
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Un client ne voit que les paiements de ses propres commandes ; le staff voit tout.
        qs = super().get_queryset()
        user = self.request.user
        if user.is_authenticated and not user.is_staff:
            return qs.filter(order__customer=user)
        return qs


class InitiatePaymentView(APIView):
    """Crée un paiement et initie la transaction FedaPay (MTN/Moov/carte).
    Pour le paiement à la livraison, seule une ligne Payment en attente est
    créée afin que la commande apparaisse dans le suivi backoffice.

    Limité par un scope de rate limiting dédié (au lieu du seul throttle anon
    générique) : chaque appel déclenche un appel payant à l'API FedaPay et crée
    une ligne Payment — un abus serait coûteux, pas juste bruyant."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "payments"

    def post(self, request):
        # Validation des données (commande et moyen de paiement).
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.validated_data["order"]
        method = serializer.validated_data["method"]

        # Paiement à la livraison : simple ligne Payment en attente, sans fournisseur.
        if method == Payment.Method.CASH_ON_DELIVERY:
            payment = Payment.objects.create(
                order=order,
                provider=Payment.Provider.CASH_ON_DELIVERY,
                method=method,
                amount_xof=order.total_xof,
            )
            return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)

        # Paiement en ligne : vérification des bascules admin (global et par moyen).
        payment_settings = PaymentSettings.get_solo()
        if not payment_settings.online_payment_enabled:
            return Response(
                {
                    "detail": "Le paiement en ligne est temporairement indisponible. "
                    "Merci de choisir le paiement à la livraison."
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if not payment_settings.is_method_enabled(method):
            return Response(
                {"detail": "Ce moyen de paiement est temporairement indisponible."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Création de la ligne Payment puis initiation de la transaction FedaPay.
        payment = Payment.objects.create(
            order=order,
            method=method,
            amount_xof=order.total_xof,
        )

        try:
            start_fedapay_transaction(payment)
        except FedaPayError as exc:
            # Échec d'initiation : la ligne est marquée en échec et signalée au backoffice.
            logger.warning("Initiation FedaPay échouée pour la commande #%s : %s", order.pk, exc)
            payment.status = Payment.Status.FAILED
            payment.save(update_fields=["status", "updated_at"])
            signal_payment_failure(payment)
            return Response(
                {"detail": str(exc), "payment": PaymentSerializer(payment).data},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


class FedaPayWebhookView(APIView):
    """Reçoit les événements FedaPay (transaction.approved, .declined, .canceled)."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        # Vérification de la signature HMAC de l'événement FedaPay.
        signature = request.headers.get("X-FEDAPAY-SIGNATURE", "")
        if not verify_webhook_signature(request.body, signature, settings.FEDAPAY_WEBHOOK_SECRET):
            return Response({"detail": "Signature invalide."}, status=status.HTTP_401_UNAUTHORIZED)

        # Décodage du corps JSON de l'événement.
        try:
            event = json.loads(request.body)
        except ValueError:
            return Response({"detail": "JSON invalide."}, status=status.HTTP_400_BAD_REQUEST)

        # Extraction de l'identifiant de transaction et du nom de l'événement.
        entity = event.get("entity", {})
        transaction_id = str(entity.get("id", ""))
        event_name = event.get("name", "")

        # Recherche de la cible locale de la transaction FedaPay : un paiement
        # de commande (pipeline classique) ou un abonnement vendeur (#279).
        try:
            payment = Payment.objects.get(fedapay_transaction_id=transaction_id)
            subscription = None
        except Payment.DoesNotExist:
            payment = None
            try:
                subscription = SellerSubscription.objects.get(fedapay_transaction_id=transaction_id)
            except SellerSubscription.DoesNotExist:
                return Response({"detail": "Transaction introuvable."}, status=status.HTTP_404_NOT_FOUND)

        target = payment if payment is not None else subscription
        expected_amount = target.amount_xof

        # Contrôle du montant : un écart entre le montant reçu et celui attendu
        # (commande ou abonnement) signale une transaction douteuse — on refuse
        # de mettre à jour le statut tant que l'incohérence n'est pas résolue.
        amount_xof = entity.get("amount")
        if amount_xof is not None:
            try:
                amount_xof = int(amount_xof)
            except (TypeError, ValueError):
                logger.error(
                    "Webhook FedaPay: montant invalide %r pour la transaction %s.", amount_xof, transaction_id
                )
                return Response({"detail": "Montant invalide."}, status=status.HTTP_400_BAD_REQUEST)
            if amount_xof != expected_amount:
                logger.error(
                    "Webhook FedaPay: montant incohérent pour la transaction %s (%s) : "
                    "reçu %s, attendu %s — statut non mis à jour.",
                    transaction_id, event_name, amount_xof, expected_amount,
                )
                return Response({"detail": "Montant incohérent."}, status=status.HTTP_400_BAD_REQUEST)

        # Mappage des événements FedaPay vers les statuts locaux.
        status_map = {
            "transaction.approved": Payment.Status.APPROVED,
            "transaction.declined": Payment.Status.DECLINED,
            "transaction.canceled": Payment.Status.CANCELED,
        }
        new_status = status_map.get(event_name)
        if new_status:
            if payment is not None:
                # Application du statut + effets de bord (commande, facture, relance).
                apply_payment_status(payment, new_status, webhook_payload=event)
            else:
                # Abonnement : statut idempotent + activation/bascule de plan si approuvé.
                apply_subscription_status(subscription, new_status, webhook_payload=event)
        else:
            # Événement non mappé : conservation du payload pour l'audit, sans toucher au statut.
            target.last_webhook_payload = event
            target.save(update_fields=["last_webhook_payload", "updated_at"])

        return Response({"detail": "ok"})


class PaymentStatusCheckView(APIView):
    """Vérifie l'état d'un paiement FedaPay directement auprès de FedaPay
    (polling depuis la page de confirmation) : resynchronise le statut local si
    le webhook n'est pas encore arrivé. Idempotent si le webhook est déjà passé
    (aucun effet de bord rejoué, pas de double envoi de facture)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, payment_id):
        # Un client ne consulte que les paiements de ses propres commandes ; le staff voit tout.
        try:
            payment = Payment.objects.select_related("order").get(pk=payment_id)
        except Payment.DoesNotExist:
            return Response({"detail": "Paiement introuvable."}, status=status.HTTP_404_NOT_FOUND)
        if not request.user.is_staff and payment.order.customer_id != request.user.id:
            return Response({"detail": "Paiement introuvable."}, status=status.HTTP_404_NOT_FOUND)

        # Seuls les paiements en ligne FedaPay lancés sont resynchronisables.
        if payment.provider != Payment.Provider.FEDAPAY or not payment.fedapay_transaction_id:
            return Response(PaymentSerializer(payment).data)

        # Interrogation de l'état réel de la transaction chez FedaPay.
        try:
            transaction = FedaPayClient().get_transaction(payment.fedapay_transaction_id)
        except FedaPayError as exc:
            logger.warning("Vérification FedaPay échouée pour le paiement #%s : %s", payment.pk, exc)
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        # Contrôle du montant (même garde que le webhook) : transaction douteuse refusée.
        amount_xof = transaction.get("amount")
        if amount_xof is not None:
            try:
                amount_xof = int(amount_xof)
            except (TypeError, ValueError):
                return Response({"detail": "Montant invalide."}, status=status.HTTP_400_BAD_REQUEST)
            if amount_xof != payment.amount_xof:
                logger.error(
                    "FedaPay: montant incohérent pour le paiement #%s (transaction %s) : "
                    "reçu %s, attendu %s.",
                    payment.pk, payment.fedapay_transaction_id, amount_xof, payment.amount_xof,
                )
                return Response({"detail": "Montant incohérent."}, status=status.HTTP_400_BAD_REQUEST)

        # Resynchronisation si FedaPay a déjà un statut final non encore reçu par webhook.
        new_status = FEDAPAY_TRANSACTION_STATUS_MAP.get(transaction.get("status", ""))
        if new_status:
            apply_payment_status(payment, new_status)

        return Response(PaymentSerializer(payment).data)
