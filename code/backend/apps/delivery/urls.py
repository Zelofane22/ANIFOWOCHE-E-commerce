from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import DeliveryViewSet, DeliverySlotViewSet, DeliveryZoneViewSet, GeolocateZoneView

router = DefaultRouter()
router.register("zones", DeliveryZoneViewSet, basename="delivery-zone")
router.register("slots", DeliverySlotViewSet, basename="delivery-slot")
router.register("", DeliveryViewSet, basename="delivery")

urlpatterns = router.urls
urlpatterns += [path("geolocate/", GeolocateZoneView.as_view(), name="delivery-geolocate")]
