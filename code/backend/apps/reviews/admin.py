from unfold.admin import ModelAdmin

from django.contrib import admin

from apps.core.admin_mixins import ReadOnlyAdminMixin

from .models import Review


@admin.register(Review)
class ReviewAdmin(ReadOnlyAdminMixin, ModelAdmin):
    list_display = ["product", "author_name", "rating", "is_approved", "created_at"]
    list_filter = ["is_approved", "rating"]
    search_fields = ["author_name", "product__name"]
    ordering = ["-created_at"]
