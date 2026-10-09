from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import AbandonedCartRetrieveView, AbandonedCartView, OrderViewSet

router = DefaultRouter()
router.register("", OrderViewSet, basename="order")

urlpatterns = [
    path("abandoned-cart/", AbandonedCartView.as_view(), name="abandoned-cart"),
    path("abandoned-cart/<str:token>/", AbandonedCartRetrieveView.as_view(), name="abandoned-cart-retrieve"),
] + router.urls
