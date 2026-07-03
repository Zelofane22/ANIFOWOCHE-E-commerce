from django.db import models
from django.utils import timezone

from apps.products.models import Category, Product


class Promotion(models.Model):
    name = models.CharField(max_length=150)
    discount_percent = models.PositiveIntegerField(help_text="Réduction en % (0-100)")
    products = models.ManyToManyField(Product, blank=True, related_name="promotions")
    categories = models.ManyToManyField(Category, blank=True, related_name="promotions")
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-starts_at"]

    def __str__(self):
        return f"{self.name} (-{self.discount_percent}%)"


class Coupon(models.Model):
    code = models.CharField(max_length=30, unique=True)
    discount_percent = models.PositiveIntegerField(help_text="Réduction en % (0-100)")
    max_uses = models.PositiveIntegerField(default=1)
    used_count = models.PositiveIntegerField(default=0)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.code

    def is_valid(self):
        if not self.is_active:
            return False
        if self.expires_at and self.expires_at < timezone.now():
            return False
        if self.used_count >= self.max_uses:
            return False
        return True
