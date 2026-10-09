from unfold.admin import ModelAdmin

from django.contrib import admin

from apps.core.admin_mixins import ReadOnlyAdminMixin

from .models import ReturnRequest


@admin.register(ReturnRequest)
class ReturnRequestAdmin(ReadOnlyAdminMixin, ModelAdmin):
    list_display = ["id", "order", "status", "refund_amount_xof", "created_at"]
    list_filter = ["status"]
    search_fields = ["order__full_name"]
    ordering = ["-created_at"]
