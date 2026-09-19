from django.conf import settings
from django.db import models
from django.utils import timezone


class SiteTheme(models.Model):
    """Réglages d'apparence du site (CMS d'apparence, US-50/US-51) — singleton
    (une seule ligne, toujours pk=1).

    Regroupe l'identité de la boutique (nom, logo) et la palette de couleurs de
    la marque. Le frontend récupère ces valeurs via /api/site-config/ pour
    habiller l'interface sans redéploiement."""

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
        # Représentation lisible : libellé du modèle de réglages.
        return "Apparence du site"

    def save(self, *args, **kwargs):
        # Force la clé primaire à 1 pour garantir le comportement singleton.
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # Empêche la suppression du singleton par l'admin.
        pass

    @classmethod
    def get_solo(cls):
        """Récupère (ou crée) la ligne unique de réglages d'apparence."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class HomeSection(models.Model):
    """Section prédéfinie et pilotable de la page d'accueil (US-53).

    L'admin ne crée ni ne supprime de sections : il active/désactive et
    ordonne les 3 sections prédéfinies. ensure_defaults() garantit leur
    présence."""

    class SectionType(models.TextChoices):
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
        # Représentation lisible : libellé du type de section.
        return self.get_section_type_display()

    @classmethod
    def ensure_defaults(cls):
        """Crée les 3 sections prédéfinies si elles sont absentes, dans l'ordre
        trust, categories, featured (order 0..2)."""
        defaults_order = [
            cls.SectionType.TRUST,
            cls.SectionType.CATEGORIES,
            cls.SectionType.FEATURED,
        ]
        # Création idempotente de chaque section manquante avec son ordre par défaut.
        for index, section_type in enumerate(defaults_order):
            cls.objects.get_or_create(
                section_type=section_type,
                defaults={"order": index, "is_enabled": True},
            )


class MenuItem(models.Model):
    """Élément de menu de navigation éditable depuis l'admin (US-E14)."""

    label = models.CharField(max_length=100)
    url = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)
    is_visible = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Élément de menu"
        verbose_name_plural = "Éléments de menu"

    def __str__(self):
        return self.label


class FooterBlock(models.Model):
    """Bloc de colonne dans le footer, éditable depuis l'admin (US-E14)."""

    title = models.CharField(max_length=100)
    items = models.JSONField(
        default=list,
        help_text='Liste d\'objets {"label", "url"}',
    )
    order = models.PositiveIntegerField(default=0)
    is_visible = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Bloc footer"
        verbose_name_plural = "Blocs footer"

    def __str__(self):
        return self.title


class AppearanceVersion(models.Model):
    """Version d'apparence (US-54) : snapshot de la configuration d'apparence
    (thème + sections d'accueil) permettant le workflow
    brouillon → prévisualisation → publication → historique/restauration.

    Tant qu'une version n'est pas publiée, le singleton SiteTheme et les
    HomeSection restent inchangés : la vitrine publique (/api/site-config/)
    ne reflète que la dernière version publiée."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Brouillon"
        PUBLISHED = "published", "Publiée"

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    # Snapshot JSON du SiteTheme : {site_name, logo (nom relatif ou null),
    # trust_arguments, colors:{brand, brand_dark, brand_medium, brand_light,
    # brand_pale}}.
    theme = models.JSONField(default=dict)
    # Snapshot JSON des HomeSection : [{"type", "enabled", "order"}, ...].
    sections = models.JSONField(default=list)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="appearance_versions",
    )

    class Meta:
        ordering = ["-published_at", "-id"]
        verbose_name = "Version d'apparence"
        verbose_name_plural = "Versions d'apparence"

    def __str__(self):
        return f"Apparence #{self.pk} ({self.get_status_display()})"

    # --- Snapshot -----------------------------------------------------------

    @staticmethod
    def serialize_theme(theme):
        """Sérialise le singleton SiteTheme en JSON (logo = nom de fichier relatif)."""
        return {
            "site_name": theme.site_name,
            "logo": theme.logo.name if theme.logo else None,
            "trust_arguments": theme.trust_arguments,
            "colors": {
                "brand": theme.color_brand,
                "brand_dark": theme.color_brand_dark,
                "brand_medium": theme.color_brand_medium,
                "brand_light": theme.color_brand_light,
                "brand_pale": theme.color_brand_pale,
            },
        }

    @staticmethod
    def serialize_sections():
        """Sérialise les HomeSection en liste de {type, enabled, order}."""
        return [
            {"type": s.section_type, "enabled": s.is_enabled, "order": s.order}
            for s in HomeSection.objects.all()
        ]

    @classmethod
    def capture_live(cls, **extra):
        """Construit (sans persister) un snapshot de la configuration live."""
        return cls(
            theme=cls.serialize_theme(SiteTheme.get_solo()),
            sections=cls.serialize_sections(),
            **extra,
        )

    def apply(self):
        """Applique ce snapshot aux modèles live (SiteTheme + HomeSection)."""
        theme = SiteTheme.get_solo()
        data = self.theme or {}
        theme.site_name = data.get("site_name", theme.site_name)
        theme.logo = data.get("logo") or None
        colors = data.get("colors") or {}
        theme.color_brand = colors.get("brand", theme.color_brand)
        theme.color_brand_dark = colors.get("brand_dark", theme.color_brand_dark)
        theme.color_brand_medium = colors.get("brand_medium", theme.color_brand_medium)
        theme.color_brand_light = colors.get("brand_light", theme.color_brand_light)
        theme.color_brand_pale = colors.get("brand_pale", theme.color_brand_pale)
        theme.trust_arguments = data.get("trust_arguments", theme.trust_arguments)
        theme.save()

        HomeSection.ensure_defaults()
        for section in self.sections or []:
            section_type = section.get("type")
            if not section_type:
                continue
            HomeSection.objects.filter(section_type=section_type).update(
                is_enabled=section.get("enabled", True),
                order=section.get("order", 0),
            )

    @classmethod
    def get_or_create_draft(cls, user=None):
        """Retourne l'unique brouillon (créé depuis la config live si absent)."""
        draft = cls.objects.filter(status=cls.Status.DRAFT).first()
        if draft is None:
            draft = cls.capture_live(status=cls.Status.DRAFT, created_by=user)
            draft.save()
        return draft

    def publish(self, user=None):
        """Applique le snapshot au live puis marque la version comme publiée."""
        self.apply()
        self.status = self.Status.PUBLISHED
        self.published_at = timezone.now()
        if user is not None:
            self.created_by = user
        self.save()
        return self
