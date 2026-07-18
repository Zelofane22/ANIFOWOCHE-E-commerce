from unfold.admin import ModelAdmin

from django.contrib import admin

from .models import HomeSection, SiteTheme


@admin.register(SiteTheme)
class SiteThemeAdmin(ModelAdmin):
    """Singleton : une seule ligne de réglages d'apparence — on n'autorise
    l'ajout que si aucune instance n'existe et on interdit la suppression."""

    fieldsets = (
        ("Identité", {"fields": ("site_name", "logo")}),
        (
            "Couleurs",
            {
                "fields": (
                    "color_brand",
                    "color_brand_dark",
                    "color_brand_medium",
                    "color_brand_light",
                    "color_brand_pale",
                )
            },
        ),
        ("Héro", {"fields": ("hero_eyebrow", "hero_title", "hero_subtitle")}),
        ("Confiance", {"fields": ("trust_arguments",)}),
    )

    def has_add_permission(self, request):
        return not SiteTheme.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(HomeSection)
class HomeSectionAdmin(ModelAdmin):
    """Les 4 sections d'accueil sont prédéfinies : l'admin ne fait que les
    activer/désactiver et les ordonner (ni ajout ni suppression)."""

    list_display = ["section_type", "is_enabled", "order"]
    list_editable = ["is_enabled", "order"]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
