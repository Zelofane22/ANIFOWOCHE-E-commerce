from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from .models import Review
from .serializers import ReviewSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    """Lecture publique des avis approuvés + soumission publique. La modération
    (approbation/suppression) reste réservée à l'admin Django, pas exposée en API."""

    queryset = Review.objects.filter(is_approved=True).select_related("product")
    serializer_class = ReviewSerializer
    http_method_names = ["get", "post", "head", "options"]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["product__slug"]
