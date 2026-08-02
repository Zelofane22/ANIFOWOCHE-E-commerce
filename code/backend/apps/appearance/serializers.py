from rest_framework import serializers

from .models import HomeSection, SiteTheme


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
