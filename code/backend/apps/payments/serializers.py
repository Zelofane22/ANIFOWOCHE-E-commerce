from rest_framework import serializers

from apps.orders.models import Order

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
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
    order_id = serializers.PrimaryKeyRelatedField(queryset=Order.objects.all(), source="order")
    method = serializers.ChoiceField(choices=Payment.Method.choices)
