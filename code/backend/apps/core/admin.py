from unfold.admin import ModelAdmin
from unfold.forms import UserChangeForm, UserCreationForm

from django.contrib import admin
from django.contrib.admin.models import LogEntry
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

User = get_user_model()


@admin.register(LogEntry)
class LogEntryAdmin(ModelAdmin):
    list_display = ["action_time", "user", "content_type", "object_repr", "action_flag"]
    list_filter = ["action_flag", "content_type"]
    search_fields = ["object_repr", "change_message"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


admin.site.unregister(User)


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    list_display = ["username", "email", "is_staff", "is_superuser", "is_active", "date_joined"]
    list_filter = ["is_staff", "is_superuser", "is_active", "date_joined"]

    def get_readonly_fields(self, request, obj=None):
        """Seul un superuser peut modifier le statut staff/superuser, les groupes
        et les permissions — un compte admin non-superuser ne doit pas pouvoir
        s'auto-promouvoir ni modifier les droits d'un autre compte admin."""
        readonly_fields = list(super().get_readonly_fields(request, obj))
        if not request.user.is_superuser:
            readonly_fields += ["is_staff", "is_superuser", "groups", "user_permissions"]
        return readonly_fields

    def has_delete_permission(self, request, obj=None):
        if not super().has_delete_permission(request, obj):
            return False
        # Un admin non-superuser ne peut pas supprimer un autre compte admin/superuser.
        if obj is not None and not request.user.is_superuser and (obj.is_staff or obj.is_superuser):
            return False
        return True

    def has_change_permission(self, request, obj=None):
        if not super().has_change_permission(request, obj):
            return False
        # Un admin non-superuser ne peut pas modifier un compte superuser.
        if obj is not None and not request.user.is_superuser and obj.is_superuser:
            return False
        return True
