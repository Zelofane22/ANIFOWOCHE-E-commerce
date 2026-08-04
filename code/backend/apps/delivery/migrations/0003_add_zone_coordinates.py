from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("delivery", "0002_seed_zones_slots"),
    ]

    operations = [
        migrations.AddField(
            model_name="deliveryzone",
            name="latitude",
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name="deliveryzone",
            name="longitude",
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name="deliveryzone",
            name="radius_km",
            field=models.DecimalField(decimal_places=2, default=3, help_text="Rayon couvert autour du point central, en kilomètres", max_digits=5),
        ),
    ]
