from unfold.admin import ModelAdmin

from django.contrib import admin

from .models import ReturnRequest


@admin.register(ReturnRequest)
class ReturnRequestAdmin(ModelAdmin):
    list_display = ["id", "order", "status", "refund_amount_xof", "created_at"]
    list_filter = ["status"]
    search_fields = ["order__full_name"]
