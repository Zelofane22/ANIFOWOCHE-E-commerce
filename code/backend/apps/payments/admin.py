from unfold.admin import ModelAdmin

from django.contrib import admin
from django.shortcuts import redirect
from django.urls import reverse

from .models import Payment, PaymentSettings


@admin.register(Payment)
class PaymentAdmin(ModelAdmin):
    list_display = ["id", "order", "provider", "method", "status", "amount_xof", "created_at"]
    list_filter = ["provider", "method", "status"]
    search_fields = ["order__full_name", "fedapay_transaction_id"]
    readonly_fields = ["last_webhook_payload"]


@admin.register(PaymentSettings)
class PaymentSettingsAdmin(ModelAdmin):
    """Lecture seule (état actuel des moyens de paiement) : toute modification
    passe obligatoirement par une SettingChangeRequest justifiée (voir
    apps.core.admin.SettingChangeRequestAdmin) — même un superuser ne modifie
    pas ce singleton directement, pour garder une trace de justification
    systématique de chaque coupure de moyen de paiement."""

    list_display = ["online_payment_enabled", "mtn_enabled", "moov_enabled", "card_enabled"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        obj = PaymentSettings.get_solo()
        return redirect(reverse("admin:payments_paymentsettings_change", args=[obj.pk]))
