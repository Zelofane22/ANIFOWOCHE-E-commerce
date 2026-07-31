from django.contrib.postgres.lookups import Unaccent
from django.db.models import Q
from rest_framework import filters


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
