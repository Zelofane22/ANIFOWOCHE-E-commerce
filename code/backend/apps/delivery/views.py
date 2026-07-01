from rest_framework import viewsets

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
