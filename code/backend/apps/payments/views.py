import json
import logging

from django.conf import settings
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.models import Order

from .models import Payment
from .serializers import InitiatePaymentSerializer, PaymentSerializer
from .services import FedaPayClient, FedaPayError, verify_webhook_signature

logger = logging.getLogger(__name__)


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """Consultation des paiements — réservée au staff (dashboard admin)."""

    queryset = Payment.objects.all().select_related("order")
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAdminUser]


class InitiatePaymentView(APIView):
    """Crée un paiement et initie la transaction FedaPay (MTN/Moov/carte)."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.validated_data["order"]
        method = serializer.validated_data["method"]

        payment = Payment.objects.create(
            order=order,
            method=method,
            amount_xof=order.total_xof,
        )

        client = FedaPayClient()
        try:
            transaction = client.create_transaction(
                amount_xof=payment.amount_xof,
                description=f"Commande ANIFOWOCHE #{order.pk}",
                callback_url=f"{settings.FRONTEND_BASE_URL}/commande/confirmation?order={order.pk}",
                customer_phone=order.phone,
                customer_email=order.email,
            )
            transaction_id = transaction.get("id") or transaction.get("v1/transaction", {}).get("id")
            payment.fedapay_transaction_id = str(transaction_id) if transaction_id else ""

            token_data = client.generate_token(transaction_id) if transaction_id else {}
            payment.payment_url = token_data.get("url", "")
            payment.save(update_fields=["fedapay_transaction_id", "payment_url", "updated_at"])
        except FedaPayError as exc:
            logger.warning("Initiation FedaPay échouée pour la commande #%s : %s", order.pk, exc)
            payment.status = Payment.Status.FAILED
            payment.save(update_fields=["status", "updated_at"])
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
        signature = request.headers.get("X-FEDAPAY-SIGNATURE", "")
        if not verify_webhook_signature(request.body, signature, settings.FEDAPAY_WEBHOOK_SECRET):
            return Response({"detail": "Signature invalide."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            event = json.loads(request.body)
        except ValueError:
            return Response({"detail": "JSON invalide."}, status=status.HTTP_400_BAD_REQUEST)

        entity = event.get("entity", {})
        transaction_id = str(entity.get("id", ""))
        event_name = event.get("name", "")

        try:
            payment = Payment.objects.get(fedapay_transaction_id=transaction_id)
        except Payment.DoesNotExist:
            return Response({"detail": "Paiement introuvable."}, status=status.HTTP_404_NOT_FOUND)

        status_map = {
            "transaction.approved": Payment.Status.APPROVED,
            "transaction.declined": Payment.Status.DECLINED,
            "transaction.canceled": Payment.Status.CANCELED,
        }
        new_status = status_map.get(event_name)
        if new_status:
            payment.status = new_status
        payment.last_webhook_payload = event
        payment.save(update_fields=["status", "last_webhook_payload", "updated_at"])

        if payment.status == Payment.Status.APPROVED:
            order = payment.order
            order.status = Order.Status.PREPARED
            order.save(update_fields=["status", "updated_at"])

        return Response({"detail": "ok"})
