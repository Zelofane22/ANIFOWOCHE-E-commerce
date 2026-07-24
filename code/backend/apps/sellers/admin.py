from django.contrib import admin

from .models import SellerProfile, Shop


@admin.register(SellerProfile)
class SellerProfileAdmin(admin.ModelAdmin):
    list_display = ["display_name", "phone", "city", "user", "created_at"]
    search_fields = ["display_name", "phone", "user__username", "user__email"]


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "whatsapp_phone", "city", "is_published", "created_at"]
    list_filter = ["is_published", "city"]
    search_fields = ["name", "slug", "whatsapp_phone"]
    prepopulated_fields = {"slug": ("name",)}
