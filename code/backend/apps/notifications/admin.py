from django.contrib import admin, messages
from django.shortcuts import redirect
from django.urls import reverse
from unfold.admin import ModelAdmin

from .models import Notification, NotificationSettings
from .services import NotificationDeliveryError, resend_notification


@admin.action(description="Renvoyer la/les notification(s) sélectionnée(s)")
def resend_notifications(modeladmin, request, queryset):
    sent, failed = 0, 0
    for notification in queryset:
        try:
            resend_notification(notification)
        except NotificationDeliveryError:
            failed += 1
            continue
        if notification.status == Notification.Status.SENT:
            sent += 1
        else:
            failed += 1
    if sent:
        modeladmin.message_user(request, f"{sent} notification(s) renvoyée(s) avec succès.", messages.SUCCESS)
    if failed:
        modeladmin.message_user(request, f"{failed} notification(s) toujours en échec.", messages.WARNING)


@admin.register(Notification)
class NotificationAdmin(ModelAdmin):
    list_display = ["id", "event", "channel", "recipient_phone", "recipient_email", "status", "created_at"]
    list_filter = ["event", "channel", "status"]
    search_fields = ["recipient_phone", "recipient_email"]
    readonly_fields = ["provider_message_id", "error_detail"]
    actions = [resend_notifications]


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
