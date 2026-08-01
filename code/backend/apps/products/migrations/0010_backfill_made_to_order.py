from django.db import migrations

MADE_TO_ORDER_CATEGORY_SLUGS = ("restauration",)


def backfill_made_to_order(apps, schema_editor):
    Product = apps.get_model("products", "Product")
    Product.objects.filter(category__slug__in=MADE_TO_ORDER_CATEGORY_SLUGS).update(
        made_to_order=True
    )


def reverse_backfill(apps, schema_editor):
    Product = apps.get_model("products", "Product")
    Product.objects.filter(category__slug__in=MADE_TO_ORDER_CATEGORY_SLUGS).update(
        made_to_order=False
    )


class Migration(migrations.Migration):
    dependencies = [
        ("products", "0009_product_made_to_order"),
    ]

    operations = [
        migrations.RunPython(backfill_made_to_order, reverse_backfill),
    ]
