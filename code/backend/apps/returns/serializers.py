from rest_framework import serializers

from apps.orders.models import Order

from .models import ReturnRequest


class ReturnRequestSerializer(serializers.ModelSerializer):
    order_id = serializers.PrimaryKeyRelatedField(queryset=Order.objects.all(), source="order", write_only=True)
    order = serializers.IntegerField(source="order.id", read_only=True)
    order_reference = serializers.CharField(source="order.reference", read_only=True)

    class Meta:
        model = ReturnRequest
        fields = [
            "id",
            "order_id",
            "order",
            "order_reference",
            "reason",
            "status",
            "refund_amount_xof",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["status", "refund_amount_xof", "created_at", "updated_at"]

    def validate_order_id(self, order):
        request = self.context.get("request")
        if request and request.user.is_authenticated and order.customer_id != request.user.id:
            raise serializers.ValidationError("Cette commande ne vous appartient pas.")
        return order
