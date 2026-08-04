from math import asin, cos, radians, sin, sqrt

from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.services import notify_delivery_confirmed, notify_delivery_in_transit

from .models import Delivery, DeliverySlot, DeliveryZone
from .serializers import (
    DeliverySerializer,
    DeliverySlotSerializer,
    DeliveryZoneSerializer,
    GeolocateZoneSerializer,
)


class GeolocateZoneView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = GeolocateZoneSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        latitude = float(serializer.validated_data["latitude"])
        longitude = float(serializer.validated_data["longitude"])

        closest = None
        for zone in DeliveryZone.objects.filter(is_active=True).exclude(latitude=None).exclude(longitude=None):
            distance_km = _distance_km(latitude, longitude, float(zone.latitude), float(zone.longitude))
            if distance_km <= float(zone.radius_km) and (closest is None or distance_km < closest[0]):
                closest = (distance_km, zone)

        if closest is None:
            return Response({"zone": None})

        distance_km, zone = closest
        return Response({"zone": DeliveryZoneSerializer(zone).data, "distance_km": round(distance_km, 2)})


def _distance_km(latitude_a, longitude_a, latitude_b, longitude_b):
    earth_radius_km = 6371
    lat_delta = radians(latitude_b - latitude_a)
    lon_delta = radians(longitude_b - longitude_a)
    value = sin(lat_delta / 2) ** 2 + cos(radians(latitude_a)) * cos(radians(latitude_b)) * sin(lon_delta / 2) ** 2
    return earth_radius_km * 2 * asin(sqrt(value))


class ReferenceDataViewSet(viewsets.ModelViewSet):
    """Lecture ouverte (nécessaire au formulaire de checkout), écriture réservée au staff."""

    def get_permissions(self):
        # Lecture ouverte au public ; toute écriture réservée au staff.
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
        # Création ouverte (checkout) ; consultation et gestion réservées au staff.
        if self.action == "create":
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def perform_update(self, serializer):
        # Notifie le client lors des passages en « en route » et « livrée ».
        previous_status = serializer.instance.status
        delivery = serializer.save()
        if previous_status != Delivery.Status.IN_TRANSIT and delivery.status == Delivery.Status.IN_TRANSIT:
            notify_delivery_in_transit(delivery)
        if previous_status != Delivery.Status.DELIVERED and delivery.status == Delivery.Status.DELIVERED:
            notify_delivery_confirmed(delivery)
