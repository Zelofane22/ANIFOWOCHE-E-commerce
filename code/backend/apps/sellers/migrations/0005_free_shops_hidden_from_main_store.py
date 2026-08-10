# Les boutiques des vendeurs FREE tiers ne doivent pas figurer sur le catalogue
# principal : on force visible_on_main_store=False pour les données existantes.
from django.conf import settings
from django.db import migrations


def hide_free_shops_from_main_store(apps, schema_editor):
    Shop = apps.get_model("sellers", "Shop")
    main_store_slug = getattr(settings, "MAIN_STORE_SLUG", "ets-anifowoche")
    Shop.objects.filter(
        seller__plan="FREE",
        visible_on_main_store=True,
    ).exclude(slug=main_store_slug).update(visible_on_main_store=False)


class Migration(migrations.Migration):

    dependencies = [
        ("sellers", "0004_shop_delivery_zones"),
    ]

    operations = [
        migrations.RunPython(hide_free_shops_from_main_store, migrations.RunPython.noop),
    ]
