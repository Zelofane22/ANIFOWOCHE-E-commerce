from django.urls import path

from .views import (
    NotificationSettingsView,
    SellerNotificationListView,
    SellerNotificationMarkAllReadView,
    SellerNotificationMarkReadView,
)

urlpatterns = [
    path("settings/", NotificationSettingsView.as_view(), name="notification-settings"),
    path("seller/", SellerNotificationListView.as_view(), name="seller-notification-list"),
    path("seller/<int:pk>/read/", SellerNotificationMarkReadView.as_view(), name="seller-notification-mark-read"),
    path("seller/mark-all-read/", SellerNotificationMarkAllReadView.as_view(), name="seller-notification-mark-all-read"),
]
