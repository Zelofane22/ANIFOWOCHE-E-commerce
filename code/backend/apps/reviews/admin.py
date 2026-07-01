from unfold.admin import ModelAdmin

from django.contrib import admin

from .models import Review


@admin.register(Review)
class ReviewAdmin(ModelAdmin):
    list_display = ["product", "author_name", "rating", "is_approved", "created_at"]
    list_filter = ["is_approved", "rating"]
    search_fields = ["author_name", "product__name"]
