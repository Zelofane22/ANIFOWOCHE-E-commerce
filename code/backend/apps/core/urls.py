from django.urls import path

from apps.notifications.views import backoffice_notifications_view

from .views import reports_view, settings_hub_view

urlpatterns = [
    path("rapports/", reports_view, name="admin_reports"),
    path("reglages/", settings_hub_view, name="admin_settings_hub"),
    path("notifications-backoffice/", backoffice_notifications_view, name="admin_backoffice_notifications"),
]
