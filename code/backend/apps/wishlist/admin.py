from unfold.admin import ModelAdmin

from django.contrib import admin

from .models import WishlistItem


@admin.register(WishlistItem)
class WishlistItemAdmin(ModelAdmin):
    list_display = ["user", "product", "added_at"]
    list_filter = ["added_at"]
    search_fields = ["user__username", "product__name"]
