from rest_framework import permissions
from rest_framework.generics import CreateAPIView

from .models import PageView
from .serializers import PageViewSerializer


class PageViewCreateView(CreateAPIView):
    """Enregistre anonymement une vue de page (tracking frontend, accès public)."""
    queryset = PageView.objects.all()
    serializer_class = PageViewSerializer
    permission_classes = [permissions.AllowAny]
