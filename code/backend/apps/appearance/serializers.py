from rest_framework import serializers

from .models import HomeSection, SiteTheme


class SiteThemeSerializer(serializers.ModelSerializer):
    logo = serializers.SerializerMethodField()
    colors = serializers.SerializerMethodField()

    class Meta:
        model = SiteTheme
        fields = [
            "site_name",
            "logo",
            "hero_eyebrow",
            "hero_title",
            "hero_subtitle",
            "trust_arguments",
            "colors",
        ]

    def get_logo(self, theme):
        if not theme.logo:
            return None
        request = self.context.get("request")
        if request is not None:
            return request.build_absolute_uri(theme.logo.url)
        return theme.logo.url

    def get_colors(self, theme):
        return {
            "brand": theme.color_brand,
            "brand_dark": theme.color_brand_dark,
            "brand_medium": theme.color_brand_medium,
            "brand_light": theme.color_brand_light,
            "brand_pale": theme.color_brand_pale,
        }


class HomeSectionSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source="section_type")
    enabled = serializers.BooleanField(source="is_enabled")

    class Meta:
        model = HomeSection
        fields = ["type", "enabled", "order"]
