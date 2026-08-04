from rest_framework import serializers

from apps.orders.models import Order

from .models import Delivery, DeliverySlot, DeliveryZone


class GeolocateZoneSerializer(serializers.Serializer):
    latitude = serializers.DecimalField(max_digits=12, decimal_places=6)
    longitude = serializers.DecimalField(max_digits=12, decimal_places=6)


class DeliveryZoneSerializer(serializers.ModelSerializer):
    """Sérialise une zone de livraison avec ses frais."""

    class Meta:
        model = DeliveryZone
        fields = ["id", "name", "fee_xof", "latitude", "longitude", "radius_km", "is_active"]


class DeliverySlotSerializer(serializers.ModelSerializer):
    """Sérialise un créneau de livraison."""

    class Meta:
        model = DeliverySlot
        fields = ["id", "label", "start_time", "end_time", "is_active"]


class DeliverySerializer(serializers.ModelSerializer):
    """Sérialise une livraison avec zone et créneau (écriture via identifiants)."""
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
        # Une seule livraison est autorisée par commande (hors livraison en cours d'édition).
        existing = Delivery.objects.filter(order=order)
        if self.instance is not None:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError("Cette commande a déjà une livraison associée.")
        return order

    def create(self, validated_data):
        # Création de la livraison puis ajout des frais de zone au total de la commande.
        delivery = super().create(validated_data)
        if delivery.zone.fee_xof:
            order = delivery.order
            order.total_xof += delivery.zone.fee_xof
            order.save(update_fields=["total_xof"])
        return delivery
