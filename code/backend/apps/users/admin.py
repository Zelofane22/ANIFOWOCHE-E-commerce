from django.contrib import admin, messages
from unfold.admin import ModelAdmin

from apps.notifications.models import Notification
from apps.notifications.services import notify_account_created

from .models import Address, Profile


@admin.action(description="Envoyer le mail de bienvenue")
def send_welcome_email(modeladmin, request, queryset):
    sent, failed = 0, 0
    for profile in queryset:
        notification = notify_account_created(profile.user)
        if notification and notification.status == Notification.Status.SENT:
            sent += 1
        else:
            failed += 1
    if sent:
        modeladmin.message_user(request, f"{sent} message(s) de bienvenue envoyé(s).", messages.SUCCESS)
    if failed:
        modeladmin.message_user(
            request,
            f"{failed} envoi(s) en échec (voir l'app Notifications pour le détail de l'erreur).",
            messages.WARNING,
        )


@admin.register(Address)
class AddressAdmin(ModelAdmin):
    list_display = ["id", "user", "label", "zone", "is_default", "created_at"]
    list_filter = ["zone", "is_default"]
    search_fields = ["user__username", "full_name", "phone"]


@admin.register(Profile)
class ProfileAdmin(ModelAdmin):
    list_display = ["user", "notification_channel", "phone"]
    list_filter = ["notification_channel"]
    search_fields = ["user__username", "user__email", "phone"]
    actions = [send_welcome_email]
