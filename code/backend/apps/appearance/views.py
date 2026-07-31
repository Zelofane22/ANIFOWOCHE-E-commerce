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
        # Garantit la présence des sections d'accueil prédéfinies.
        HomeSection.ensure_defaults()

        # Lecture du thème (singleton) et des sections.
        theme = SiteTheme.get_solo()
        sections = HomeSection.objects.all()

        # Assemblage de la configuration complète pour le frontend.
        return Response(
            {
                "theme": SiteThemeSerializer(theme, context={"request": request}).data,
                "sections": HomeSectionSerializer(
                    sections, many=True, context={"request": request}
                ).data,
            }
        )
