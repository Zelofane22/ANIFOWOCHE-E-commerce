from unfold.admin import ModelAdmin

from django.contrib import admin

from apps.core.admin_mixins import ReadOnlyAdminMixin

from .models import WishlistItem


@admin.register(WishlistItem)
class WishlistItemAdmin(ReadOnlyAdminMixin, ModelAdmin):
    list_display = ["user", "product", "added_at"]
    list_filter = ["added_at"]
    search_fields = ["user__username", "product__name"]
