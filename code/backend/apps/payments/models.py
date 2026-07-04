from django.db import models

from apps.core.models import SingletonModel
from apps.orders.models import Order


class PaymentSettings(SingletonModel):
    """Bascules admin (Sprint 6) sur le paiement en ligne : couper un moyen de
    paiement précis, ou le paiement en ligne dans son ensemble (repli
    implicite sur le paiement à la livraison, une commande existe déjà sans
    Payment associé). Toute désactivation passe par une SettingChangeRequest
    (justification + validation superadmin) — voir apps.core.services."""

    online_payment_enabled = models.BooleanField(
        default=True, help_text="Si désactivé, aucun paiement en ligne ne peut être initié (repli commande à la livraison)."
    )
    mtn_enabled = models.BooleanField(default=True, help_text="Autoriser le paiement par MTN Mobile Money.")
    moov_enabled = models.BooleanField(default=True, help_text="Autoriser le paiement par Moov Money.")
    card_enabled = models.BooleanField(default=True, help_text="Autoriser le paiement par carte bancaire.")

    class Meta:
        verbose_name = "Réglages paiement"
        verbose_name_plural = "Réglages paiement"

    def __str__(self):
        return "Réglages paiement"

    @property
    def mobile_money_enabled(self):
        return self.mtn_enabled or self.moov_enabled

    @property
    def mobile_money_available(self):
        return self.online_payment_enabled and self.mobile_money_enabled

    @property
    def card_available(self):
        return self.online_payment_enabled and self.card_enabled

    @property
    def cash_on_delivery_enabled(self):
        return True

    def is_method_enabled(self, method):
        if method == Payment.Method.CASH_ON_DELIVERY:
            return self.cash_on_delivery_enabled
        return {
            Payment.Method.MTN: self.mtn_enabled,
            Payment.Method.MOOV: self.moov_enabled,
            Payment.Method.CARD: self.card_enabled,
        }.get(method, False)


class Payment(models.Model):
    class Provider(models.TextChoices):
        FEDAPAY = "fedapay", "FedaPay"
        CASH_ON_DELIVERY = "cash_on_delivery", "Paiement à la livraison"

    class Method(models.TextChoices):
        MTN = "mtn", "MTN Mobile Money"
        MOOV = "moov", "Moov Money"
        CARD = "card", "Carte bancaire"
        CASH_ON_DELIVERY = "cash_on_delivery", "Paiement à la livraison"

    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        APPROVED = "approved", "Approuvé"
        DECLINED = "declined", "Refusé"
        CANCELED = "canceled", "Annulé"
        FAILED = "failed", "Échec d'initialisation"

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="payments")
    provider = models.CharField(max_length=20, choices=Provider.choices, default=Provider.FEDAPAY)
    method = models.CharField(max_length=20, choices=Method.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    amount_xof = models.PositiveIntegerField()
    fedapay_transaction_id = models.CharField(max_length=100, blank=True)
    payment_url = models.URLField(blank=True)
    last_webhook_payload = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Paiement #{self.pk} — commande #{self.order_id} ({self.status})"
