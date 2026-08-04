from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("delivery", "0003_add_zone_coordinates"),
        ("sellers", "0003_add_visible_on_main_store_to_shop"),
    ]

    operations = [
        migrations.AddField(
            model_name="shop",
            name="delivery_zones",
            field=models.ManyToManyField(blank=True, related_name="shops", to="delivery.deliveryzone"),
        ),
    ]
