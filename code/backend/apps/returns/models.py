from django.db import models

from apps.orders.models import Order


class ReturnRequest(models.Model):
    class Status(models.TextChoices):
        REQUESTED = "requested", "Demandé"
        APPROVED = "approved", "Approuvé"
        REJECTED = "rejected", "Refusé"
        REFUNDED = "refunded", "Remboursé"

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="return_requests")
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.REQUESTED)
    refund_amount_xof = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Retour"
        verbose_name_plural = "Retours"

    def __str__(self):
        return f"Retour #{self.pk} — commande #{self.order_id} ({self.status})"
