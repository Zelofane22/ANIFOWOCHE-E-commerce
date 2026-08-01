from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("products", "0008_unaccent_extension"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="made_to_order",
            field=models.BooleanField(
                default=False,
                help_text="Produit fabriqué à la commande : il reste visible dans le filtre 'en stock' même si le stock est nul.",
            ),
        ),
    ]
