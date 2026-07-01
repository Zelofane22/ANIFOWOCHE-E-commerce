from rest_framework.routers import DefaultRouter

from .views import DeliveryViewSet, DeliverySlotViewSet, DeliveryZoneViewSet

router = DefaultRouter()
router.register("zones", DeliveryZoneViewSet, basename="delivery-zone")
router.register("slots", DeliverySlotViewSet, basename="delivery-slot")
router.register("", DeliveryViewSet, basename="delivery")

urlpatterns = router.urls
