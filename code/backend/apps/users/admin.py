from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from unfold.admin import ModelAdmin, StackedInline, TabularInline
from unfold.forms import UserChangeForm, UserCreationForm

from apps.notifications.models import Notification
from apps.notifications.services import notify_account_created

from .models import Address, AdminUser, Client, Profile


class ProfileInline(StackedInline):
    model = Profile
    can_delete = False
    extra = 0
    verbose_name = "préférences de notification"


class AddressInline(TabularInline):
    model = Address
    extra = 0
    verbose_name = "adresse de livraison"
    verbose_name_plural = "adresses de livraison"


@admin.action(description="Envoyer le mail de bienvenue")
def send_welcome_email(modeladmin, request, queryset):
    sent, failed = 0, 0
    for client in queryset:
        notification = notify_account_created(client)
        if notification and notification.status == Notification.Status.SENT:
            sent += 1
        else:
            failed += 1
    if sent:
        modeladmin.message_user(request, f"{sent} message(s) de bienvenue envoyé(s).", messages.SUCCESS)
    if failed:
        modeladmin.message_user(
            request,
            f"{failed} envoi(s) en échec (voir l'app Notifications pour le détail de l'erreur).",
            messages.WARNING,
        )


@admin.register(Client)
class ClientAdmin(BaseUserAdmin, ModelAdmin):
    """Comptes clients (is_staff=False) — le queryset est filtré par le
    manager du proxy. Pas de bloc permissions : un client n'a jamais accès
    à l'admin ; pour promouvoir un compte, passer par « Administrateurs ».

    Le profil (préférences de notification) et les adresses de livraison
    sont édités directement sur la fiche client via des inlines."""

    form = UserChangeForm
    add_form = UserCreationForm
    list_display = ["username", "email", "first_name", "last_name", "is_active", "date_joined"]
    list_filter = ["is_active", "date_joined"]
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Informations personnelles", {"fields": ("first_name", "last_name", "email")}),
        ("Statut", {"fields": ("is_active",)}),
        ("Dates importantes", {"fields": ("last_login", "date_joined")}),
    )
    readonly_fields = ["last_login", "date_joined"]
    actions = [send_welcome_email]

    def get_inlines(self, request, obj=None):
        # Pas d'inlines sur le formulaire d'ajout : l'utilisateur n'existe
        # pas encore (flux en deux étapes de UserAdmin).
        if obj is None:
            return []
        return [ProfileInline, AddressInline]


@admin.register(AdminUser)
class AdminUserAdmin(BaseUserAdmin, ModelAdmin):
    """Comptes administrateurs (is_staff=True) : superadmins et agents staff.
    Un superadmin définit les droits des agents via les groupes/permissions."""

    form = UserChangeForm
    add_form = UserCreationForm
    list_display = ["username", "email", "is_superuser", "is_active", "date_joined"]
    list_filter = ["is_superuser", "is_active", "date_joined"]

    def save_model(self, request, obj, form, change):
        if not change:
            # Un compte créé depuis cette section est forcément un admin.
            obj.is_staff = True
        super().save_model(request, obj, form, change)

    def get_readonly_fields(self, request, obj=None):
        """Seul un superuser peut modifier le statut staff/superuser, les groupes
        et les permissions — un agent staff ne doit pas pouvoir s'auto-promouvoir
        ni modifier les droits d'un autre compte admin."""
        readonly_fields = list(super().get_readonly_fields(request, obj))
        if not request.user.is_superuser:
            readonly_fields += ["is_staff", "is_superuser", "groups", "user_permissions"]
        return readonly_fields

    def has_delete_permission(self, request, obj=None):
        if not super().has_delete_permission(request, obj):
            return False
        # Un agent staff ne peut pas supprimer un compte admin/superadmin.
        if obj is not None and not request.user.is_superuser:
            return False
        return True

    def has_change_permission(self, request, obj=None):
        if not super().has_change_permission(request, obj):
            return False
        # Un agent staff ne peut pas modifier un compte superadmin.
        if obj is not None and not request.user.is_superuser and obj.is_superuser:
            return False
        return True


