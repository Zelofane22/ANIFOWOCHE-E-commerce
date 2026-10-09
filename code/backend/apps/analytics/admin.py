from unfold.admin import ModelAdmin

from django.contrib import admin

from apps.core.admin_mixins import ReadOnlyAdminMixin

from .models import PageView


@admin.register(PageView)
class PageViewAdmin(ReadOnlyAdminMixin, ModelAdmin):
    list_display = ["path", "referrer", "session_key", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["path", "session_key"]
    date_hierarchy = "created_at"
