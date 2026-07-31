import json
import logging

from django.conf import settings
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.notifications.services import notify_invoice
from apps.orders.models import Order

from .models import Payment, PaymentSettings
from .serializers import InitiatePaymentSerializer, PaymentSerializer
from .services import (
    FedaPayError,
    signal_payment_failure,
    start_fedapay_transaction,
    verify_webhook_signature,
)

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

        # Recherche du paiement local correspondant à la transaction FedaPay.
        try:
            payment = Payment.objects.get(fedapay_transaction_id=transaction_id)
        except Payment.DoesNotExist:
            return Response({"detail": "Paiement introuvable."}, status=status.HTTP_404_NOT_FOUND)

        # Mappage des événements FedaPay vers les statuts locaux.
        status_map = {
            "transaction.approved": Payment.Status.APPROVED,
            "transaction.declined": Payment.Status.DECLINED,
            "transaction.canceled": Payment.Status.CANCELED,
        }
        new_status = status_map.get(event_name)
        if new_status:
            payment.status = new_status
        # Conservation du payload reçu pour l'audit.
        payment.last_webhook_payload = event
        payment.save(update_fields=["status", "last_webhook_payload", "updated_at"])

        # Paiement approuvé : la commande passe en « préparée » et la facture est envoyée.
        if payment.status == Payment.Status.APPROVED:
            order = payment.order
            order.status = Order.Status.PREPARED
            order.save(update_fields=["status", "updated_at"])
            notify_invoice(payment)
        # Paiement refusé/annulé : l'échec est signalé au backoffice pour relance.
        elif new_status in (Payment.Status.DECLINED, Payment.Status.CANCELED):
            # US-34 : l'échec remonte dans la cloche backoffice, d'où l'admin
            # peut ouvrir le paiement et le relancer.
            signal_payment_failure(payment)

        return Response({"detail": "ok"})
