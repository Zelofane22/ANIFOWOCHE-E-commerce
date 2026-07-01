from django.urls import path

from .views import FedaPayWebhookView, InitiatePaymentView

urlpatterns = [
    path("initiate/", InitiatePaymentView.as_view(), name="payment_initiate"),
    path("webhook/", FedaPayWebhookView.as_view(), name="payment_webhook"),
]
