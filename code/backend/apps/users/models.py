from django.conf import settings
from django.db import models

from apps.delivery.models import DeliveryZone


class Address(models.Model):
    """Adresse de livraison enregistrée par un client (US-18)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="addresses"
    )
    label = models.CharField(max_length=100, blank=True, help_text="Ex. Maison, Bureau")
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20)
    zone = models.ForeignKey(DeliveryZone, on_delete=models.PROTECT, related_name="addresses")
    notes = models.CharField(max_length=255, blank=True, help_text="Indications complémentaires")
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_default", "-created_at"]

    def __str__(self):
        return f"{self.label or self.zone.name} — {self.full_name}"
