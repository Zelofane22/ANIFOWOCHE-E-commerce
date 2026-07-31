from django.conf import settings
from django.db import models

from apps.products.models import Product


class WishlistItem(models.Model):
    """Produit mis en favori par un client (couple user/produit unique)."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wishlist_items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="wishlisted_by")
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-added_at"]
        constraints = [
            # Un même produit ne peut apparaître qu'une fois par utilisateur.
            models.UniqueConstraint(fields=["user", "product"], name="unique_wishlist_item"),
        ]

    def __str__(self):
        # Représentation lisible : utilisateur et produit favori.
        return f"{self.user} ♥ {self.product.name}"
