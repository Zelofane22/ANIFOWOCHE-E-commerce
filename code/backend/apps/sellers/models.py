from django.conf import settings
from django.db import models
from django.utils.text import slugify


class SellerProfile(models.Model):
    """Profil commercial d'un utilisateur : identité publique et plan d'abonnement."""
    class Plan(models.TextChoices):
        FREE = "FREE", "Gratuit"
        STARTER = "STARTER", "Starter"
        PRO = "PRO", "Pro"
        BUSINESS = "BUSINESS", "Business"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="seller_profile")
    display_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=30)
    city = models.CharField(max_length=100, blank=True)
    plan = models.CharField(max_length=10, choices=Plan.choices, default=Plan.FREE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_name"]

    def __str__(self):
        # Représentation lisible : le nom affiché du vendeur.
        return self.display_name


class Shop(models.Model):
    """Boutique publique d'un vendeur, accessible via son slug."""
    seller = models.OneToOneField(SellerProfile, on_delete=models.CASCADE, related_name="shop")
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=180, unique=True)
    whatsapp_phone = models.CharField(max_length=30)
    city = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    delivery_zones = models.ManyToManyField("delivery.DeliveryZone", blank=True, related_name="shops")
    is_published = models.BooleanField(default=True)
    is_official = models.BooleanField(default=False, help_text="Boutique officielle anifowoche.com : aucune limite de plan. Une seule boutique peut être officielle.")
    visible_on_main_store = models.BooleanField(
        default=True,
        help_text="Afficher les produits de cette boutique dans le catalogue, "
                  "la recherche et la wishlist de la vitrine principale anifowoche.com",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        # Représentation lisible : le nom de la boutique.
        return self.name

    @property
    def public_path(self):
        # Chemin d'accès public de la boutique sur le frontend.
        return f"/shop/{self.slug}"

    def save(self, *args, **kwargs):
        # Génère automatiquement un slug unique à partir du nom si absent.
        if not self.slug:
            self.slug = self._build_unique_slug(self.name)
        # Une seule boutique peut être officielle à la fois.
        if self.is_official:
            Shop.objects.filter(is_official=True).exclude(pk=self.pk).update(is_official=False)
        # Hygiène des données : une boutique FREE tierce ne peut pas figurer sur
        # le catalogue principal (la règle est aussi appliquée côté requêtes).
        from apps.sellers.limits import is_free  # Import local : évite le cycle au chargement.

        if self.seller_id and is_free(self.seller):
            self.visible_on_main_store = False
        super().save(*args, **kwargs)

    @classmethod
    def _build_unique_slug(cls, name):
        # Construction d'un slug de base puis incrémentation d'un suffixe numérique si conflit.
        base = slugify(name)[:150] or "boutique"
        slug = base
        suffix = 2
        while cls.objects.filter(slug=slug).exists():
            slug = f"{base}-{suffix}"
            suffix += 1
        return slug


class SellerSubscription(models.Model):
    """Abonnement payant d'un vendeur ANIF Seller (mirroring apps.payments.Payment)."""

    class Provider(models.TextChoices):
        FEDAPAY = "fedapay", "FedaPay"

    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        APPROVED = "approved", "Approuvé"
        DECLINED = "declined", "Refusé"
        CANCELED = "canceled", "Annulé"
        FAILED = "failed", "Échec d'initialisation"

    seller = models.ForeignKey(SellerProfile, on_delete=models.CASCADE, related_name="subscriptions")
    plan = models.CharField(max_length=10, choices=SellerProfile.Plan.choices, default=SellerProfile.Plan.PRO)
    amount_xof = models.PositiveIntegerField()
    provider = models.CharField(max_length=20, choices=Provider.choices, default=Provider.FEDAPAY)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    fedapay_transaction_id = models.CharField(max_length=100, blank=True)
    payment_url = models.URLField(blank=True)
    last_webhook_payload = models.JSONField(blank=True, null=True)
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    last_expiry_reminder_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Abonnement #{self.pk} — {self.seller.display_name} ({self.status})"
