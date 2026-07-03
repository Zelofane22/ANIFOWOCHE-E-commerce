from unfold.admin import ModelAdmin

from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(ModelAdmin):
    list_display = ["id", "event", "channel", "recipient_phone", "recipient_email", "status", "created_at"]
    list_filter = ["event", "channel", "status"]
    search_fields = ["recipient_phone", "recipient_email"]
    readonly_fields = ["provider_message_id", "error_detail"]
