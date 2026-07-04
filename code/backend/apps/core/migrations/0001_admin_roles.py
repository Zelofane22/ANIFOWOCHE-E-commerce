from django.db import migrations


ROLES = {
    "Gestion catalogue": {
        "products": {
            "category": ["add", "change", "delete", "view"],
            "product": ["add", "change", "delete", "view"],
            "productimage": ["add", "change", "delete", "view"],
        },
        "promotions": {
            "promotion": ["add", "change", "delete", "view"],
            "coupon": ["add", "change", "delete", "view"],
        },
        "content": {
            "banner": ["add", "change", "delete", "view"],
        },
    },
    "Gestion commandes": {
        "orders": {
            "order": ["view", "change"],
            "orderitem": ["view", "change"],
        },
        "returns": {
            "returnrequest": ["view", "change"],
        },
        "delivery": {
            "deliveryzone": ["view", "change"],
            "deliveryslot": ["view", "change"],
            "delivery": ["add", "view", "change"],
        },
        "payments": {
            "payment": ["view"],
        },
    },
    "Support client": {
        "orders": {
            "order": ["view"],
        },
        "returns": {
            "returnrequest": ["view"],
        },
        "reviews": {
            "review": ["view", "change", "delete"],
        },
        "users": {
            "address": ["view"],
            "profile": ["view"],
        },
        "notifications": {
            "notification": ["view"],
        },
    },
}


def create_roles(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")

    for role_name, apps_perms in ROLES.items():
        group, _ = Group.objects.get_or_create(name=role_name)
        permissions = []
        for app_label, models in apps_perms.items():
            for model_name, actions in models.items():
                try:
                    content_type = ContentType.objects.get(app_label=app_label, model=model_name)
                except ContentType.DoesNotExist:
                    continue
                for action in actions:
                    try:
                        permissions.append(
                            Permission.objects.get(
                                content_type=content_type, codename=f"{action}_{model_name}"
                            )
                        )
                    except Permission.DoesNotExist:
                        continue
        group.permissions.set(permissions)


def remove_roles(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Group.objects.filter(name__in=ROLES.keys()).delete()


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
        ("contenttypes", "0002_remove_content_type_name"),
        ("products", "0003_productimage"),
        ("promotions", "0001_initial"),
        ("content", "0001_initial"),
        ("orders", "0002_order_coupon_code_order_discount_xof"),
        ("returns", "0001_initial"),
        ("delivery", "0002_seed_zones_slots"),
        ("payments", "0001_initial"),
        ("reviews", "0001_initial"),
        ("users", "0002_profile"),
        ("notifications", "0002_notification_recipient_email_and_more"),
    ]

    operations = [
        migrations.RunPython(create_roles, remove_roles),
    ]
