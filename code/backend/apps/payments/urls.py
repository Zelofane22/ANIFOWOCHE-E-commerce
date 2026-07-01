from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import FedaPayWebhookView, InitiatePaymentView, PaymentViewSet

router = DefaultRouter()
router.register("", PaymentViewSet, basename="payment")

urlpatterns = [
    path("initiate/", InitiatePaymentView.as_view(), name="payment_initiate"),
    path("webhook/", FedaPayWebhookView.as_view(), name="payment_webhook"),
    path("", include(router.urls)),
]
