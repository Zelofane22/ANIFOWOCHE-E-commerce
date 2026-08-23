from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FooterBlock, HomeSection, MenuItem, SiteTheme
from .serializers import (
    FooterBlockSerializer,
    HomeSectionSerializer,
    MenuItemSerializer,
    SiteThemeSerializer,
)


class SiteConfigView(APIView):
    """Lecture publique de la configuration d'apparence du site (US-50/US-51/
    US-53/US-E14) : thème (identité, couleurs, héro), sections pilotables de
    la page d'accueil, items de navigation et blocs footer éditables depuis
    l'admin."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        HomeSection.ensure_defaults()

        theme = SiteTheme.get_solo()
        sections = HomeSection.objects.all()
        menu_items = MenuItem.objects.filter(is_visible=True)
        footer_blocks = FooterBlock.objects.filter(is_visible=True)

        return Response(
            {
                "theme": SiteThemeSerializer(theme, context={"request": request}).data,
                "sections": HomeSectionSerializer(
                    sections, many=True, context={"request": request}
                ).data,
                "menu_items": MenuItemSerializer(menu_items, many=True).data,
                "footer_blocks": FooterBlockSerializer(footer_blocks, many=True).data,
            }
        )
