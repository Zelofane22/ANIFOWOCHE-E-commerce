from rest_framework import permissions
from rest_framework.generics import CreateAPIView

from .models import PageView
from .serializers import PageViewSerializer


class PageViewCreateView(CreateAPIView):
    """Enregistre anonymement une vue de page (tracking frontend, accès public)."""
    queryset = PageView.objects.all()
    serializer_class = PageViewSerializer
    # Pas d'authentification : un token JWT expire dans le header Authorization
    # ne doit pas faire echouer le tracking anonyme avec un 401.
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
