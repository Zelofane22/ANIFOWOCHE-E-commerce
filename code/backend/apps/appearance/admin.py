from unfold.admin import ModelAdmin

from django.contrib import admin

from .models import AppearanceVersion, FooterBlock, HomeSection, MenuItem, SiteTheme


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
        ("Confiance", {"fields": ("trust_arguments",)}),
    )

    def has_add_permission(self, request):
        return not SiteTheme.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(HomeSection)
class HomeSectionAdmin(ModelAdmin):
    """Les 3 sections d'accueil sont prédéfinies : l'admin ne fait que les
    activer/désactiver et les ordonner (ni ajout ni suppression)."""

    list_display = ["section_type", "is_enabled", "order"]
    list_editable = ["is_enabled", "order"]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(MenuItem)
class MenuItemAdmin(ModelAdmin):
    list_display = ["label", "order", "is_visible"]
    list_editable = ["order", "is_visible"]


@admin.register(FooterBlock)
class FooterBlockAdmin(ModelAdmin):
    list_display = ["title", "order", "is_visible"]
    list_editable = ["order", "is_visible"]


@admin.register(AppearanceVersion)
class AppearanceVersionAdmin(ModelAdmin):
    """Historique des versions d'apparence (US-54) — lecture seule : la
    publication/restauration se fait via l'API super-admin."""

    list_display = ["id", "status", "published_at", "updated_at", "created_by"]
    list_filter = ["status"]
    readonly_fields = ["status", "theme", "sections", "published_at", "created_at", "updated_at", "created_by"]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
