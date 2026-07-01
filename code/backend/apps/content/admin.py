from unfold.admin import ModelAdmin

from django.contrib import admin

from .models import Banner


@admin.register(Banner)
class BannerAdmin(ModelAdmin):
    list_display = ["title", "is_published", "order", "created_at"]
    list_filter = ["is_published"]
    search_fields = ["title"]
