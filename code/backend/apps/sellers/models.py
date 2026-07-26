from django.conf import settings
from django.db import models
from django.utils.text import slugify


class SellerProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="seller_profile")
    display_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=30)
    city = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_name"]

    def __str__(self):
        return self.display_name


class Shop(models.Model):
    seller = models.OneToOneField(SellerProfile, on_delete=models.CASCADE, related_name="shop")
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=180, unique=True)
    whatsapp_phone = models.CharField(max_length=30)
    city = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    @property
    def public_path(self):
        return f"/shop/{self.slug}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._build_unique_slug(self.name)
        super().save(*args, **kwargs)

    @classmethod
    def _build_unique_slug(cls, name):
        base = slugify(name)[:150] or "boutique"
        slug = base
        suffix = 2
        while cls.objects.filter(slug=slug).exists():
            slug = f"{base}-{suffix}"
            suffix += 1
        return slug
