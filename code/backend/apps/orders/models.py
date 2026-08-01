from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from apps.products.models import Product


class Order(models.Model):
    """Commande client : statut, total, remise coupon, annulation et suivi de livraison."""
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
        # Représentation lisible : numéro de commande et nom du client.
        return f"Commande #{self.pk} — {self.full_name}"

    @property
    def reference(self):
        # Référence humaine de la commande (numéro zéro-paddé).
        return f"CMD-{self.pk:06d}" if self.pk else "—"

    def recompute_total(self):
        # Recalcule le total à partir de la somme des sous-totaux des lignes.
        self.total_xof = sum(item.subtotal_xof for item in self.items.all())
        self.save(update_fields=["total_xof"])

    def cancel(self, reason=""):
        # Annulation interdite si le statut n'est pas annulable.
        if self.status not in self.CANCELLABLE_STATUSES:
            raise ValidationError(
                f"Impossible d'annuler une commande avec le statut « {self.get_status_display()} »."
            )
        from django.utils import timezone
        # Restitution des stocks (global et par couleur) de chaque article.
        for item in self.items.all():
            if item.product.made_to_order:
                continue
            if item.color_name and item.product.colors:
                colors = item.product.colors
                for color in colors:
                    if color["name"] == item.color_name:
                        color["stock"] = color.get("stock", 0) + item.quantity
                        break
                Product.objects.filter(pk=item.product_id).update(colors=colors)
            Product.objects.filter(pk=item.product_id).update(
                stock=models.F("stock") + item.quantity
            )
        # Passage de la commande en annulée avec horodatage et motif.
        self.status = self.Status.CANCELLED
        self.cancelled_at = timezone.now()
        self.cancellation_reason = reason
        self.save(update_fields=["status", "cancelled_at", "cancellation_reason"])


class OrderItem(models.Model):
    """Ligne de commande : produit, quantité, prix figé à la commande, variantes choisies."""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="order_items")
    quantity = models.PositiveIntegerField(default=1)
    unit_price_xof = models.PositiveIntegerField(help_text="Prix unitaire au moment de la commande")
    color_name = models.CharField(max_length=50, blank=True, default="")
    color_hex = models.CharField(max_length=7, blank=True, default="")
    selected_options = models.JSONField(
        default=list, blank=True,
        help_text='[{"group_id": 1, "group_name": "Accompagnement", "option_id": 5, "option_name": "Frites", "price_xof": 500}, ...]',
    )

    def __str__(self):
        # Représentation lisible : quantité et nom du produit.
        return f"{self.quantity} x {self.product.name}"

    @property
    def subtotal_xof(self):
        # Sous-total : quantité × prix unitaire + suppléments d'options.
        base = self.quantity * self.unit_price_xof
        options_total = sum(opt.get("price_xof", 0) for opt in self.selected_options) * self.quantity
        return base + options_total
