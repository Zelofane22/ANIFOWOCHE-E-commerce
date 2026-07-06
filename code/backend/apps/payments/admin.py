from unfold.admin import ModelAdmin

from django.contrib import admin, messages
from django.shortcuts import redirect
from django.urls import reverse

from .models import Payment, PaymentSettings
from .services import FedaPayError, PaymentRelaunchError, relaunch_payment


@admin.action(description="Relancer le paiement (nouveau lien envoyé au client)")
def relaunch_payments(modeladmin, request, queryset):
    """US-34 : pour chaque paiement échoué/refusé/annulé sélectionné, crée une
    nouvelle transaction FedaPay et envoie le nouveau lien de paiement au client."""
    relaunched, skipped, failed = 0, 0, 0
    for payment in queryset:
        try:
            relaunch_payment(payment)
        except PaymentRelaunchError as exc:
            skipped += 1
            modeladmin.message_user(request, f"Paiement #{payment.pk} ignoré : {exc}", messages.WARNING)
        except FedaPayError:
            failed += 1
        else:
            relaunched += 1
    if relaunched:
        modeladmin.message_user(
            request,
            f"{relaunched} paiement(s) relancé(s) — nouveau lien envoyé au client.",
            messages.SUCCESS,
        )
    if failed:
        modeladmin.message_user(
            request,
            f"{failed} relance(s) en échec côté FedaPay (voir la cloche de notifications).",
            messages.ERROR,
        )


@admin.register(Payment)
class PaymentAdmin(ModelAdmin):
    list_display = ["id", "order", "provider", "method", "status", "amount_xof", "created_at"]
    list_filter = ["provider", "method", "status"]
    search_fields = ["order__full_name", "fedapay_transaction_id"]
    readonly_fields = ["last_webhook_payload"]
    actions = [relaunch_payments]


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
