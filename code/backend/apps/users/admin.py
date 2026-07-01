from django.contrib import admin
from unfold.admin import ModelAdmin

from .models import Address


@admin.register(Address)
class AddressAdmin(ModelAdmin):
    list_display = ["id", "user", "label", "zone", "is_default", "created_at"]
    list_filter = ["zone", "is_default"]
    search_fields = ["user__username", "full_name", "phone"]
