from rest_framework import permissions, viewsets

from apps.notifications.services import notify_delivery_in_transit

from .models import Delivery, DeliverySlot, DeliveryZone
from .serializers import DeliverySerializer, DeliverySlotSerializer, DeliveryZoneSerializer


class ReferenceDataViewSet(viewsets.ModelViewSet):
    """Lecture ouverte (nécessaire au formulaire de checkout), écriture réservée au staff."""

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class DeliveryZoneViewSet(ReferenceDataViewSet):
    queryset = DeliveryZone.objects.filter(is_active=True)
    serializer_class = DeliveryZoneSerializer


class DeliverySlotViewSet(ReferenceDataViewSet):
    queryset = DeliverySlot.objects.filter(is_active=True)
    serializer_class = DeliverySlotSerializer


class DeliveryViewSet(viewsets.ModelViewSet):
    """La création (checkout) est ouverte ; la consultation et la gestion
    des livraisons (dashboard admin) sont réservées au staff."""

    queryset = Delivery.objects.all().select_related("zone", "slot", "order")
    serializer_class = DeliverySerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def perform_update(self, serializer):
        previous_status = serializer.instance.status
        delivery = serializer.save()
        if previous_status != Delivery.Status.IN_TRANSIT and delivery.status == Delivery.Status.IN_TRANSIT:
            notify_delivery_in_transit(delivery)
