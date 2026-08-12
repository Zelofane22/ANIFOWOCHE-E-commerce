from django.core.management.base import BaseCommand

from apps.products.category_tree import seed_category_tree
from apps.products.models import Category


class Command(BaseCommand):
    """Insère l'arborescence de catégories par défaut (idempotent)."""

    help = "Seeds the default 3-level category tree."

    def handle(self, *args, **options):
        seed_category_tree(Category)
        self.stdout.write(
            self.style.SUCCESS("Arborescence des catégories créée/mise à jour avec succès.")
        )
