from django.db import models

from apps.orders.models import Order


class Payment(models.Model):
    class Provider(models.TextChoices):
        FEDAPAY = "fedapay", "FedaPay"

    class Method(models.TextChoices):
        MTN = "mtn", "MTN Mobile Money"
        MOOV = "moov", "Moov Money"
        CARD = "card", "Carte bancaire"

    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        APPROVED = "approved", "Approuvé"
        DECLINED = "declined", "Refusé"
        CANCELED = "canceled", "Annulé"
        FAILED = "failed", "Échec d'initialisation"

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="payments")
    provider = models.CharField(max_length=20, choices=Provider.choices, default=Provider.FEDAPAY)
    method = models.CharField(max_length=10, choices=Method.choices)
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
