from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import FedaPayWebhookView, InitiatePaymentView, PaymentStatusCheckView, PaymentViewSet

router = DefaultRouter()
router.register("", PaymentViewSet, basename="payment")

urlpatterns = [
    path("initiate/", InitiatePaymentView.as_view(), name="payment_initiate"),
    path("webhook/", FedaPayWebhookView.as_view(), name="payment_webhook"),
    path("status/<int:payment_id>/", PaymentStatusCheckView.as_view(), name="payment_status_check"),
    path("", include(router.urls)),
]
