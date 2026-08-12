from django.db import migrations


def migrate_existing_categories(apps, schema_editor):
    """Rattache les catégories plates existantes à l'arbre 3 niveaux si possible.

    Les catégories créées manuellement avant cette migration sont toutes des
    racines (parent=None, level=1). Si leur slug correspond à un nœud de niveau 3
    de l'arbre par défaut, on crée le chemin complet et on redirige les produits
    vers ce nœud de niveau 3. Sinon, elles restent des racines autonomes.
    """
    from apps.products.category_tree import get_leaf_paths, seed_category_tree

    Category = apps.get_model("products", "Category")
    Product = apps.get_model("products", "Product")

    # L'arbre par défaut n'est pas encore en base ; on le crée maintenant.
    seed_category_tree(Category)

    leaf_paths = get_leaf_paths()

    for old_category in Category.objects.filter(parent=None, level=1).iterator():
        path = leaf_paths.get(old_category.slug)
        if not path:
            # Pas d'équivalent évident : la catégorie reste une racine autonome.
            continue

        # Le dernier élément du chemin est le nœud de niveau 3 cible.
        target_slug = path[-1]["slug"]
        # On remonte jusqu'au niveau 2, puis 1, pour localiser le parent du L3.
        # seed_category_tree a déjà créé la hiérarchie, on peut donc naviguer
        # par parent/slug.
        level1_slug = path[0]["slug"]
        level2_slug = path[1]["slug"]

        try:
            level1 = Category.objects.get(parent=None, slug=level1_slug)
            level2 = Category.objects.get(parent=level1, slug=level2_slug)
            target = Category.objects.get(parent=level2, slug=target_slug)
        except Category.DoesNotExist:
            # L'arbre n'a pas pu être créé correctement ; on laisse l'ancienne
            # catégorie telle quelle pour ne pas casser les FK.
            continue

        # Redirige les produits vers le nœud de niveau 3.
        Product.objects.filter(category=old_category).update(category=target)

        # L'ancienne catégorie reste en place (pas de suppression) mais n'a plus
        # de produits rattachés. On la désactive pour éviter qu'elle apparaisse
        # dans les listes publiques.
        old_category.is_active = False
        old_category.save(update_fields=["is_active"])


def reverse_migration(apps, schema_editor):
    """Opération inverse volontairement limitée : on ne remet pas les FK en arrière."""
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("products", "0011_alter_category_options_category_is_active_and_more"),
    ]

    operations = [
        migrations.RunPython(
            migrate_existing_categories,
            reverse_code=reverse_migration,
        ),
    ]
