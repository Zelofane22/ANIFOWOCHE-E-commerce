from unfold.admin import ModelAdmin

from django.contrib import admin

from .models import SellerProfile, Shop


@admin.register(SellerProfile)
class SellerProfileAdmin(ModelAdmin):
    list_display = ["display_name", "phone", "city", "user", "created_at"]
    search_fields = ["display_name", "phone", "user__username", "user__email"]


@admin.register(Shop)
class ShopAdmin(ModelAdmin):
    list_display = ["name", "slug", "whatsapp_phone", "city", "is_published", "visible_on_main_store", "created_at"]
    list_filter = ["is_published", "visible_on_main_store", "city"]
    search_fields = ["name", "slug", "whatsapp_phone"]
    prepopulated_fields = {"slug": ("name",)}
    filter_horizontal = ["delivery_zones"]
