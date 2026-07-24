from django.db import models
from django.utils.text import slugify


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

    seller = models.ForeignKey(
        "sellers.SellerProfile",
        on_delete=models.CASCADE,
        related_name="products",
        blank=True,
        null=True,
    )
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=180, unique=True, blank=True)
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
        if not self.slug:
            self.slug = self._build_unique_slug(self.name)
        super().save(*args, **kwargs)

    @classmethod
    def _build_unique_slug(cls, name):
        base = slugify(name)[:160] or "produit"
        slug = base
        suffix = 2
        while cls.objects.filter(slug=slug).exists():
            slug = f"{base}-{suffix}"
            suffix += 1
        return slug


class ProductImage(models.Model):
    """Photos additionnelles de la galerie produit, en complément de
    Product.image (utilisée comme couverture partout ailleurs : cartes,
    panier, wishlist...)."""

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/gallery/")
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "created_at"]

    def __str__(self):
        return f"Image #{self.order} — {self.product.name}"
