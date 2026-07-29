from django.contrib.postgres.lookups import Unaccent
from django.db.models import Q
from rest_framework import filters


class AccentInsensitiveSearchFilter(filters.SearchFilter):
    def filter_queryset(self, request, queryset, view):
        search_terms = self.get_search_terms(request)
        if not search_terms:
            return queryset

        search_fields = self.get_search_fields(view, request)
        if not search_fields:
            return queryset

        orm_lookups = [
            self.construct_search(str(search_field))
            for search_field in search_fields
        ]

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
        return f"{field_name}__unaccent__icontains"
