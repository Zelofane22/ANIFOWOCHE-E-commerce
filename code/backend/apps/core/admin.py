from unfold.admin import ModelAdmin
from unfold.forms import UserChangeForm, UserCreationForm

from django.contrib import admin, messages
from django.contrib.admin.models import LogEntry
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.shortcuts import redirect
from django.urls import reverse

from .models import SettingChangeRequest, StoreSettings
from .services import process_new_request, approve_setting_change, reject_setting_change

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


@admin.register(StoreSettings)
class StoreSettingsAdmin(ModelAdmin):
    """Lecture seule (état actuel du mode maintenance) : toute modification
    passe obligatoirement par une SettingChangeRequest justifiée — voir
    SettingChangeRequestAdmin. Même un superuser ne modifie pas ce singleton
    directement, pour garder une trace de justification systématique."""

    list_display = ["maintenance_mode"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        obj = StoreSettings.get_solo()
        return redirect(reverse("admin:core_storesettings_change", args=[obj.pk]))


@admin.register(SettingChangeRequest)
class SettingChangeRequestAdmin(ModelAdmin):
    """Workflow Sprint 6 : un admin crée une demande (réglage + valeur visée +
    justification obligatoire) ; si la valeur visée est « à risque » (couper un
    moyen de paiement, couper le paiement en ligne, activer la maintenance) et
    que le demandeur n'est pas superadmin, la demande reste en attente et les
    superadmins sont notifiés (email + badge admin) jusqu'à validation."""

    list_display = ["setting_key", "target_value", "status", "requested_by", "created_at", "reviewed_by"]
    list_filter = ["status", "setting_key"]

    def get_readonly_fields(self, request, obj=None):
        always_readonly = ["requested_by", "created_at", "reviewed_by", "reviewed_at"]
        if obj is None:
            # Le statut est toujours forcé à PENDING à la création (save_model) ;
            # rien à examiner/valider tant que la demande vient d'être créée.
            return always_readonly + ["status", "review_note"]
        if obj.status != SettingChangeRequest.Status.PENDING or not request.user.is_superuser:
            return always_readonly + ["setting_key", "target_value", "reason", "status", "review_note"]
        return always_readonly + ["setting_key", "target_value", "reason"]

    def has_change_permission(self, request, obj=None):
        # Un demandeur non-superadmin peut voir sa demande (lecture seule via
        # has_view_permission) mais ne peut jamais l'éditer/l'auto-valider.
        if obj is not None and not request.user.is_superuser:
            return False
        return super().has_change_permission(request, obj)

    def save_model(self, request, obj, form, change):
        if not change:
            obj.requested_by = request.user
            obj.status = SettingChangeRequest.Status.PENDING
            super().save_model(request, obj, form, change)
            process_new_request(obj)
            obj.refresh_from_db()
            if obj.status == SettingChangeRequest.Status.REJECTED:
                messages.error(request, f"Demande refusée automatiquement : {obj.review_note}")
            elif obj.status == SettingChangeRequest.Status.APPROVED:
                messages.success(request, "Changement non risqué : approuvé et appliqué automatiquement.")
            else:
                messages.info(request, "Demande enregistrée — en attente de validation par un superadmin.")
            return

        # `obj` porte déjà le statut CIBLE soumis par le formulaire (approved/
        # rejected) — approve_setting_change/reject_setting_change exigent un
        # objet encore PENDING (garde-fou anti double-application), donc on
        # leur passe l'enregistrement tel qu'il est réellement en base.
        pending_request = SettingChangeRequest.objects.get(pk=obj.pk)
        if pending_request.status != SettingChangeRequest.Status.PENDING:
            return  # Déjà tranchée : rien à ré-appliquer.

        if obj.status == SettingChangeRequest.Status.APPROVED:
            approve_setting_change(change_request=pending_request, reviewer=request.user, note=obj.review_note)
            if pending_request.status == SettingChangeRequest.Status.REJECTED:
                messages.error(request, f"Refusée automatiquement : {pending_request.review_note}")
        elif obj.status == SettingChangeRequest.Status.REJECTED:
            reject_setting_change(change_request=pending_request, reviewer=request.user, note=obj.review_note)
