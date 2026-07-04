from django.apps import apps as global_apps
from django.contrib.auth.management import create_permissions
from django.db import migrations

# Sprint 6 : le rôle "Gestion commandes" peut demander la coupure d'un moyen
# de paiement / du paiement en ligne / activer la maintenance (justification
# obligatoire, approbation superadmin si la demande est à risque — voir
# apps.core.services). Les 3 rôles peuvent au moins consulter l'état actuel
# des réglages boutique/paiement.
VIEW_ONLY_GRANTS = {
    "Gestion catalogue": [("core", "storesettings", ["view"]), ("payments", "paymentsettings", ["view"])],
    "Gestion commandes": [
        ("core", "storesettings", ["view"]),
        ("payments", "paymentsettings", ["view"]),
        ("core", "settingchangerequest", ["add", "view"]),
    ],
    "Support client": [("core", "storesettings", ["view"]), ("payments", "paymentsettings", ["view"])],
}


def grant_permissions(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")

    # Les permissions add_/change_/delete_/view_ pour StoreSettings,
    # SettingChangeRequest et PaymentSettings ne sont normalement créées que
    # par le signal post_migrate, en toute fin de `migrate` — trop tard pour
    # cette même migration qui vient de créer ces modèles. On les force ici.
    for app_label in ("core", "payments"):
        create_permissions(global_apps.get_app_config(app_label), verbosity=0)

    for role_name, grants in VIEW_ONLY_GRANTS.items():
        try:
            group = Group.objects.get(name=role_name)
        except Group.DoesNotExist:
            continue
        for app_label, model_name, actions in grants:
            try:
                content_type = ContentType.objects.get(app_label=app_label, model=model_name)
            except ContentType.DoesNotExist:
                continue
            for action in actions:
                try:
                    permission = Permission.objects.get(content_type=content_type, codename=f"{action}_{model_name}")
                except Permission.DoesNotExist:
                    continue
                group.permissions.add(permission)


def revoke_permissions(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")

    for role_name, grants in VIEW_ONLY_GRANTS.items():
        try:
            group = Group.objects.get(name=role_name)
        except Group.DoesNotExist:
            continue
        for app_label, model_name, actions in grants:
            try:
                content_type = ContentType.objects.get(app_label=app_label, model=model_name)
            except ContentType.DoesNotExist:
                continue
            for action in actions:
                try:
                    permission = Permission.objects.get(content_type=content_type, codename=f"{action}_{model_name}")
                except Permission.DoesNotExist:
                    continue
                group.permissions.remove(permission)


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0002_initial"),
        ("payments", "0002_paymentsettings"),
    ]

    operations = [
        migrations.RunPython(grant_permissions, revoke_permissions),
    ]
