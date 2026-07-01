from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["id", "event", "channel", "recipient_phone", "status", "created_at"]
    list_filter = ["event", "channel", "status"]
    search_fields = ["recipient_phone"]
    readonly_fields = ["provider_message_id", "error_detail"]
