from django.db import models


class SiteTheme(models.Model):
    """Réglages d'apparence du site (CMS d'apparence, US-50/US-51) — singleton
    (une seule ligne, toujours pk=1).

    Regroupe l'identité de la boutique (nom, logo), la palette de couleurs de la
    marque et les textes de la section héro de la page d'accueil. Le frontend
    récupère ces valeurs via /api/site-config/ pour habiller l'interface sans
    redéploiement."""

    site_name = models.CharField(max_length=100, default="ANIFOWOCHE")
    logo = models.ImageField(upload_to="appearance/", blank=True, null=True)

    color_brand = models.CharField(
        max_length=7,
        default="#c99f08",
        help_text="Couleur principale de la marque, au format hex #rrggbb.",
    )
    color_brand_dark = models.CharField(
        max_length=7,
        default="#8b6604",
        help_text="Variante foncée de la couleur de marque, au format hex #rrggbb.",
    )
    color_brand_medium = models.CharField(
        max_length=7,
        default="#a67c06",
        help_text="Variante intermédiaire de la couleur de marque, au format hex #rrggbb.",
    )
    color_brand_light = models.CharField(
        max_length=7,
        default="#fef3c7",
        help_text="Variante claire de la couleur de marque, au format hex #rrggbb.",
    )
    color_brand_pale = models.CharField(
        max_length=7,
        default="#fffaf0",
        help_text="Variante très pâle de la couleur de marque, au format hex #rrggbb.",
    )

    hero_eyebrow = models.CharField(max_length=100, blank=True, default="Collection Cotonou")
    hero_title = models.CharField(max_length=200, blank=True, default="Tissus, vêtements & accessoires")
    hero_subtitle = models.CharField(
        max_length=500,
        blank=True,
        default=(
            "Des pièces sélectionnées pour le quotidien, les cérémonies et les "
            "sorties, avec paiement mobile money et livraison à domicile sur Cotonou."
        ),
    )

    trust_arguments = models.JSONField(
        default=list,
        blank=True,
        help_text=(
            "Liste de textes courts (arguments de confiance), "
            "ex. ['Livraison sous 48h', 'Paiement MTN, Moov, Visa']."
        ),
    )

    class Meta:
        verbose_name = "Apparence du site"
        verbose_name_plural = "Apparence du site"

    def __str__(self):
        return "Apparence du site"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class HomeSection(models.Model):
    """Section prédéfinie et pilotable de la page d'accueil (US-53).

    L'admin ne crée ni ne supprime de sections : il active/désactive et
    ordonne les 4 sections prédéfinies. ensure_defaults() garantit leur
    présence."""

    class SectionType(models.TextChoices):
        HERO = "hero", "Héro / carrousel"
        TRUST = "trust", "Arguments de confiance"
        CATEGORIES = "categories", "Catégories"
        FEATURED = "featured", "Produits mis en avant"

    section_type = models.CharField(max_length=20, choices=SectionType.choices, unique=True)
    is_enabled = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Section d'accueil"
        verbose_name_plural = "Sections d'accueil"

    def __str__(self):
        return self.get_section_type_display()

    @classmethod
    def ensure_defaults(cls):
        """Crée les 4 sections prédéfinies si elles sont absentes, dans l'ordre
        hero, trust, categories, featured (order 0..3)."""
        defaults_order = [
            cls.SectionType.HERO,
            cls.SectionType.TRUST,
            cls.SectionType.CATEGORIES,
            cls.SectionType.FEATURED,
        ]
        for index, section_type in enumerate(defaults_order):
            cls.objects.get_or_create(
                section_type=section_type,
                defaults={"order": index, "is_enabled": True},
            )
