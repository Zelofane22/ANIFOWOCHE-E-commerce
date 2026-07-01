from rest_framework import serializers

from apps.orders.models import Order

from .models import Delivery, DeliverySlot, DeliveryZone


class DeliveryZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryZone
        fields = ["id", "name", "fee_xof", "is_active"]


class DeliverySlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliverySlot
        fields = ["id", "label", "start_time", "end_time", "is_active"]


class DeliverySerializer(serializers.ModelSerializer):
    zone = DeliveryZoneSerializer(read_only=True)
    slot = DeliverySlotSerializer(read_only=True)
    order_id = serializers.PrimaryKeyRelatedField(queryset=Order.objects.all(), source="order", write_only=True)
    zone_id = serializers.PrimaryKeyRelatedField(
        queryset=DeliveryZone.objects.all(), source="zone", write_only=True
    )
    slot_id = serializers.PrimaryKeyRelatedField(
        queryset=DeliverySlot.objects.all(), source="slot", write_only=True
    )

    class Meta:
        model = Delivery
        fields = [
            "id",
            "order_id",
            "zone",
            "zone_id",
            "slot",
            "slot_id",
            "courier_name",
            "status",
            "scheduled_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate_order_id(self, order):
        existing = Delivery.objects.filter(order=order)
        if self.instance is not None:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError("Cette commande a déjà une livraison associée.")
        return order
