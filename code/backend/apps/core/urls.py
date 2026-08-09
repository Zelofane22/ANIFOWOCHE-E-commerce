from django.urls import path

from apps.notifications.views import (
    backoffice_notifications_view,
    mark_all_notifications_read,
    mark_notification_read,
)

from .views import reports_view, settings_hub_view

urlpatterns = [
    path("rapports/", reports_view, name="admin_reports"),
    path("reglages/", settings_hub_view, name="admin_settings_hub"),
    path("notifications-backoffice/", backoffice_notifications_view, name="admin_backoffice_notifications"),
    path(
        "notifications-backoffice/marquer-tout-lu/",
        mark_all_notifications_read,
        name="admin_backoffice_notifications_read_all",
    ),
    path(
        "notifications-backoffice/<int:pk>/marquer-lu/",
        mark_notification_read,
        name="admin_backoffice_notification_read",
    ),
]
