from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Product(models.Model):
    class Size(models.TextChoices):
        S = "S", "S"
        M = "M", "M"
        L = "L", "L"
        XL = "XL", "XL"
        UNIQUE = "UNIQUE", "Taille unique"

    class Unit(models.TextChoices):
        PIECE = "piece", "Pièce"
        METRE = "metre", "Mètre"

    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=180, unique=True)
    description = models.TextField(blank=True)
    price_xof = models.PositiveIntegerField(help_text="Prix en francs CFA (XOF)")
    unit = models.CharField(
        max_length=10,
        choices=Unit.choices,
        default=Unit.PIECE,
        help_text="Unité de vente (ex. tissu/bazin vendus au mètre)",
    )
    size = models.CharField(max_length=10, choices=Size.choices, default=Size.UNIQUE)
    stock = models.PositiveIntegerField(default=0)
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Un produit vendu au mètre n'a pas de taille (S/M/L n'a pas de sens pour un tissu).
        if self.unit == self.Unit.METRE:
            self.size = self.Size.UNIQUE
        super().save(*args, **kwargs)
