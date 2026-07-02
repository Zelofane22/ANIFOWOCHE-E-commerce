from rest_framework import viewsets

from .models import Banner
from .serializers import BannerSerializer


class BannerViewSet(viewsets.ReadOnlyModelViewSet):
    """Lecture publique des bannières publiées ; la gestion (création,
    publication, ordre) reste réservée à l'admin Django."""

    queryset = Banner.objects.filter(is_published=True)
    serializer_class = BannerSerializer
