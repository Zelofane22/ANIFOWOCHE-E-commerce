from django.db import migrations


def map_legacy_restauration(apps, schema_editor):
    """Remplace l'ancienne catégorie plate 'restauration' par Alimentation > Repas.

    La migration 0012 crée l'arbre via seed_categories ; les produits de
    l'ancienne catégorie plate 'restauration' (L1 legacy) sont rattachés à la
    sous-catégorie 'repas' de la branche Alimentation.
    """
    Category = apps.get_model("products", "Category")
    Product = apps.get_model("products", "Product")

    try:
        food = Category.objects.get(parent=None, slug="food")
        repas = Category.objects.get(parent=food, slug="repas")
    except Category.DoesNotExist:
        # Arbre non seedé ou structure modifiée : rien à faire.
        return

    legacy = Category.objects.filter(parent=None, slug="restauration").first()
    if not legacy:
        return

    Product.objects.filter(category=legacy).update(category=repas)
    legacy.is_active = False
    legacy.save(update_fields=["is_active"])


class Migration(migrations.Migration):
    dependencies = [("products", "0012_migrate_existing_categories")]
    operations = [migrations.RunPython(map_legacy_restauration, reverse_code=migrations.RunPython.noop)]
