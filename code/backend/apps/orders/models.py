from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from apps.products.models import Product


class Order(models.Model):
    class Status(models.TextChoices):
        RECEIVED = "received", "Reçue"
        PREPARED = "prepared", "Préparée"
        DELIVERED = "delivered", "Livrée"
        CANCELLED = "cancelled", "Annulée"

    CANCELLABLE_STATUSES = {Status.RECEIVED, Status.PREPARED}

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="orders",
        null=True,
        blank=True,
    )
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100, default="Cotonou")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.RECEIVED)
    coupon_code = models.CharField(max_length=30, blank=True, default="")
    discount_xof = models.PositiveIntegerField(default=0)
    total_xof = models.PositiveIntegerField(default=0)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.CharField(max_length=500, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Commande #{self.pk} — {self.full_name}"

    @property
    def reference(self):
        return f"CMD-{self.pk:06d}" if self.pk else "—"

    def recompute_total(self):
        self.total_xof = sum(item.subtotal_xof for item in self.items.all())
        self.save(update_fields=["total_xof"])

    def cancel(self, reason=""):
        if self.status not in self.CANCELLABLE_STATUSES:
            raise ValidationError(
                f"Impossible d'annuler une commande avec le statut « {self.get_status_display()} »."
            )
        from django.utils import timezone
        for item in self.items.all():
            Product.objects.filter(pk=item.product_id).update(
                stock=models.F("stock") + item.quantity
            )
        self.status = self.Status.CANCELLED
        self.cancelled_at = timezone.now()
        self.cancellation_reason = reason
        self.save(update_fields=["status", "cancelled_at", "cancellation_reason"])


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="order_items")
    quantity = models.PositiveIntegerField(default=1)
    unit_price_xof = models.PositiveIntegerField(help_text="Prix unitaire au moment de la commande")

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"

    @property
    def subtotal_xof(self):
        return self.quantity * self.unit_price_xof
