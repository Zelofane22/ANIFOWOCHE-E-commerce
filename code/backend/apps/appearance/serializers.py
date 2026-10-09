import re

from django.conf import settings
from rest_framework import serializers

from .models import AppearanceVersion, FooterBlock, HomeSection, MenuItem, SiteTheme


HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


class SiteThemeSerializer(serializers.ModelSerializer):
    """Sérialise le thème du site : logo en URL absolue et palette de couleurs groupée."""
    logo = serializers.SerializerMethodField()
    colors = serializers.SerializerMethodField()

    class Meta:
        model = SiteTheme
        fields = [
            "site_name",
            "logo",
            "trust_arguments",
            "colors",
        ]

    def get_logo(self, theme):
        # Renvoie l'URL absolue du logo (None si non défini).
        if not theme.logo:
            return None
        request = self.context.get("request")
        if request is not None:
            return request.build_absolute_uri(theme.logo.url)
        return theme.logo.url

    def get_colors(self, theme):
        # Regroupe les variantes de la couleur de marque dans un objet dédié.
        return {
            "brand": theme.color_brand,
            "brand_dark": theme.color_brand_dark,
            "brand_medium": theme.color_brand_medium,
            "brand_light": theme.color_brand_light,
            "brand_pale": theme.color_brand_pale,
        }


class HomeSectionSerializer(serializers.ModelSerializer):
    """Sérialise une section d'accueil avec les noms exposés côté frontend."""
    type = serializers.CharField(source="section_type")
    enabled = serializers.BooleanField(source="is_enabled")

    class Meta:
        model = HomeSection
        fields = ["type", "enabled", "order"]


class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = ["label", "url", "order"]


class FooterBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = FooterBlock
        fields = ["title", "items", "order"]


def render_theme_snapshot(snapshot, request=None):
    """Transforme un snapshot de thème en payload public (logo en URL absolue).

    Le snapshot stocke le logo sous forme de nom de fichier relatif ; le
    frontend public attend une URL absolue comme celle produite par
    SiteThemeSerializer."""
    data = dict(snapshot or {})
    logo = data.get("logo")
    if logo and request is not None:
        data["logo"] = request.build_absolute_uri(settings.MEDIA_URL + str(logo).lstrip("/"))
    elif not logo:
        data["logo"] = None
    return data


class AppearanceVersionSerializer(serializers.ModelSerializer):
    """Sérialise une version d'apparence (thème + sections + métadonnées)."""

    class Meta:
        model = AppearanceVersion
        fields = [
            "id",
            "status",
            "theme",
            "sections",
            "published_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "status", "published_at", "created_at", "updated_at"]

    def validate_theme(self, value):
        # Le thème doit être un objet, avec des couleurs au format hex si fournies.
        if not isinstance(value, dict):
            raise serializers.ValidationError("Le thème doit être un objet.")
        colors = value.get("colors")
        if colors is not None:
            if not isinstance(colors, dict):
                raise serializers.ValidationError("Le champ colors doit être un objet.")
            for key in ("brand", "brand_dark", "brand_medium", "brand_light", "brand_pale"):
                color = colors.get(key)
                if color is not None and not HEX_COLOR_RE.match(color):
                    raise serializers.ValidationError(
                        {key: f"Couleur invalide : {key} doit être au format #rrggbb."}
                    )
        return value

    def validate_sections(self, value):
        # Les sections doivent être une liste d'objets {type, enabled, order}.
        if not isinstance(value, list):
            raise serializers.ValidationError("Les sections doivent être une liste.")
        for section in value:
            if not isinstance(section, dict) or "type" not in section:
                raise serializers.ValidationError(
                    "Chaque section doit être un objet contenant au moins 'type'."
                )
        return value
