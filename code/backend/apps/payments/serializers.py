from rest_framework import serializers

from apps.orders.models import Order

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    """Sérialise un paiement en lecture seule (tous les champs sont en lecture seule)."""

    class Meta:
        model = Payment
        fields = [
            "id",
            "order",
            "provider",
            "method",
            "status",
            "amount_xof",
            "fedapay_transaction_id",
            "payment_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class InitiatePaymentSerializer(serializers.Serializer):
    """Valide la demande d'initiation de paiement : commande et moyen de paiement."""
    order_id = serializers.PrimaryKeyRelatedField(queryset=Order.objects.all(), source="order")
    method = serializers.ChoiceField(choices=Payment.Method.choices)
