from unfold.admin import ModelAdmin

from django.contrib import admin
from django.shortcuts import redirect
from django.urls import reverse

from .models import Notification, NotificationSettings


@admin.register(Notification)
class NotificationAdmin(ModelAdmin):
    list_display = ["id", "event", "channel", "recipient_phone", "recipient_email", "status", "created_at"]
    list_filter = ["event", "channel", "status"]
    search_fields = ["recipient_phone", "recipient_email"]
    readonly_fields = ["provider_message_id", "error_detail"]


@admin.register(NotificationSettings)
class NotificationSettingsAdmin(ModelAdmin):
    """Singleton : une seule ligne de réglages, pas de liste à parcourir —
    on redirige directement vers son formulaire d'édition."""

    list_display = ["whatsapp_enabled", "sms_enabled"]

    def has_add_permission(self, request):
        return not NotificationSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        obj = NotificationSettings.get_solo()
        return redirect(reverse("admin:notifications_notificationsettings_change", args=[obj.pk]))
