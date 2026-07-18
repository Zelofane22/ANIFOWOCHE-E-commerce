from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import HomeSection, SiteTheme
from .serializers import HomeSectionSerializer, SiteThemeSerializer


class SiteConfigView(APIView):
    """Lecture publique de la configuration d'apparence du site (US-50/US-51/
    US-53) : thème (identité, couleurs, héro) et sections pilotables de la page
    d'accueil. Le frontend s'en sert pour habiller l'interface sans
    redéploiement."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        HomeSection.ensure_defaults()

        theme = SiteTheme.get_solo()
        sections = HomeSection.objects.all()

        return Response(
            {
                "theme": SiteThemeSerializer(theme, context={"request": request}).data,
                "sections": HomeSectionSerializer(
                    sections, many=True, context={"request": request}
                ).data,
            }
        )
