from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ["id", "order", "provider", "method", "status", "amount_xof", "created_at"]
    list_filter = ["provider", "method", "status"]
    search_fields = ["order__full_name", "fedapay_transaction_id"]
    readonly_fields = ["last_webhook_payload"]
