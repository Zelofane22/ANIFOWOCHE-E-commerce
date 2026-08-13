from unfold.admin import ModelAdmin

from django.contrib import admin

from .models import SellerProfile, Shop


@admin.register(SellerProfile)
class SellerProfileAdmin(ModelAdmin):
    """Lecture seule : ces données appartiennent au vendeur (gérées via /seller/*),
    l'admin boutique ne doit pas pouvoir les modifier."""

    list_display = ["display_name", "phone", "city", "plan", "user", "created_at"]
    list_filter = ["plan", "city"]
    search_fields = ["display_name", "phone", "user__username", "user__email"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Shop)
class ShopAdmin(ModelAdmin):
    """Lecture seule : ces données appartiennent au vendeur (gérées via /seller/*),
    l'admin boutique ne doit pas pouvoir les modifier."""

    list_display = ["name", "seller", "whatsapp_phone", "city", "is_published", "visible_on_main_store", "created_at"]
    list_select_related = ["seller"]
    list_filter = ["is_published", "visible_on_main_store", "city"]
    search_fields = ["name", "slug", "whatsapp_phone"]
    prepopulated_fields = {"slug": ("name",)}
    filter_horizontal = ["delivery_zones"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
