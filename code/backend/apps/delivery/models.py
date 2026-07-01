from django.db import models

from apps.orders.models import Order


class DeliveryZone(models.Model):
    """Quartier de Cotonou desservi par la livraison."""

    name = models.CharField(max_length=100, unique=True)
    fee_xof = models.PositiveIntegerField(default=0, help_text="Frais de livraison en XOF")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class DeliverySlot(models.Model):
    """Créneau horaire de livraison (ex. Matin, Soir)."""

    label = models.CharField(max_length=50, unique=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["start_time"]

    def __str__(self):
        return self.label


class Delivery(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        ASSIGNED = "assigned", "Affectée"
        IN_TRANSIT = "in_transit", "En route"
        DELIVERED = "delivered", "Livrée"

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="delivery")
    zone = models.ForeignKey(DeliveryZone, on_delete=models.PROTECT, related_name="deliveries")
    slot = models.ForeignKey(DeliverySlot, on_delete=models.PROTECT, related_name="deliveries")
    courier_name = models.CharField(max_length=150, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    scheduled_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Deliveries"

    def __str__(self):
        return f"Livraison #{self.pk} — commande #{self.order_id} ({self.status})"
