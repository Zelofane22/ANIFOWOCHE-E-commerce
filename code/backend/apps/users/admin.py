from django.contrib import admin
from unfold.admin import ModelAdmin

from .models import Address, Profile


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
