from rest_framework import viewsets

from apps.notifications.services import notify_delivery_in_transit

from .models import Delivery, DeliverySlot, DeliveryZone
from .serializers import DeliverySerializer, DeliverySlotSerializer, DeliveryZoneSerializer


class DeliveryZoneViewSet(viewsets.ModelViewSet):
    queryset = DeliveryZone.objects.filter(is_active=True)
    serializer_class = DeliveryZoneSerializer


class DeliverySlotViewSet(viewsets.ModelViewSet):
    queryset = DeliverySlot.objects.filter(is_active=True)
    serializer_class = DeliverySlotSerializer


class DeliveryViewSet(viewsets.ModelViewSet):
    queryset = Delivery.objects.all().select_related("zone", "slot", "order")
    serializer_class = DeliverySerializer

    def perform_update(self, serializer):
        previous_status = serializer.instance.status
        delivery = serializer.save()
        if previous_status != Delivery.Status.IN_TRANSIT and delivery.status == Delivery.Status.IN_TRANSIT:
            notify_delivery_in_transit(delivery)
