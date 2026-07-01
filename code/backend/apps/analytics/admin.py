from unfold.admin import ModelAdmin

from django.contrib import admin

from .models import PageView


@admin.register(PageView)
class PageViewAdmin(ModelAdmin):
    list_display = ["path", "referrer", "session_key", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["path", "session_key"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
