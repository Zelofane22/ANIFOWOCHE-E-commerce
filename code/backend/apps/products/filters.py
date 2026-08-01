import django_filters

from django.contrib.postgres.lookups import Unaccent
from django.db.models import Q
from rest_framework import filters

from .models import Product


class AccentInsensitiveSearchFilter(filters.SearchFilter):
    """Filtre de recherche insensible aux accents (ex. « bazîn » trouve aussi « bazin »)."""

    def filter_queryset(self, request, queryset, view):
        # Extrait les termes de recherche de la requête.
        search_terms = self.get_search_terms(request)
        if not search_terms:
            return queryset

        # Extrait les champs de recherche déclarés par la vue.
        search_fields = self.get_search_fields(view, request)
        if not search_fields:
            return queryset

        # Transforme chaque champ en lookup ORM insensible aux accents.
        orm_lookups = [
            self.construct_search(str(search_field))
            for search_field in search_fields
        ]

        # Applique chaque terme de recherche en OR sur tous les champs.
        for search_term in search_terms:
            queries = [
                Q(**{orm_lookup: search_term})
                for orm_lookup in orm_lookups
            ]
            queryset = queryset.filter(
                queries[0] if len(queries) == 1 else queries[0] | queries[1]
            )

        return queryset

    def construct_search(self, field_name):
        # Lookup combinant unaccent et icontains pour une recherche sans accents.
        return f"{field_name}__unaccent__icontains"


class ProductFilter(django_filters.FilterSet):
    """Filtres du catalogue public, dont « in_stock » qui inclut les produits sur commande."""
    in_stock = django_filters.CharFilter(method="filter_in_stock")

    class Meta:
        model = Product
        fields = {
            "category__slug": ["exact"],
            "unit": ["exact"],
            "price_xof": ["gte", "lte"],
            "stock": ["gt"],
        }

    def filter_in_stock(self, queryset, name, value):
        # En stock : stock réel > 0 OU produit fabriqué à la commande (aucun stock).
        if value.strip().lower() in ("1", "true", "yes", "on"):
            return queryset.filter(Q(stock__gt=0) | Q(made_to_order=True))
        if value.strip().lower() in ("0", "false", "no", "off"):
            return queryset.exclude(Q(stock__gt=0) | Q(made_to_order=True))
        return queryset
