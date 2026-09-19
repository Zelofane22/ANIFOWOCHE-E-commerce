from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AppearanceVersion, FooterBlock, HomeSection, MenuItem, SiteTheme
from .serializers import (
    AppearanceVersionSerializer,
    FooterBlockSerializer,
    HomeSectionSerializer,
    MenuItemSerializer,
    SiteThemeSerializer,
    render_theme_snapshot,
)


class IsSuperAdmin(permissions.BasePermission):
    """Accès réservé aux superadmins (création/modification/publication/
    restauration de versions d'apparence)."""

    message = "Réservé aux superadmins."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_superuser
        )


class SiteConfigView(APIView):
    """Lecture publique de la configuration d'apparence du site (US-50/US-51/
    US-53/US-E14) : thème (identité, couleurs), sections pilotables de la page
    d'accueil, items de navigation et blocs footer éditables depuis l'admin.

    Retourne uniquement la configuration **publiée** (modèles live)."""

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


class DraftConfigView(APIView):
    """Lecture et modification du brouillon d'apparence (super-admin uniquement).

    GET  : renvoie le brouillon courant (créé depuis la config live si absent).
    PUT  : met à jour (ou crée) le brouillon — sans toucher la config publiée."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        draft = AppearanceVersion.get_or_create_draft(user=request.user)
        return Response(AppearanceVersionSerializer(draft).data)

    def put(self, request):
        draft = AppearanceVersion.get_or_create_draft(user=request.user)
        serializer = AppearanceVersionSerializer(draft, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        # Merge du thème entrant avec l'existant afin de préserver les champs
        # non renvoyés (ex. logo) et les couleurs non modifiées.
        current_theme = dict(draft.theme or {})
        incoming_theme = serializer.validated_data.get("theme")
        if incoming_theme is not None:
            incoming_colors = incoming_theme.get("colors") or {}
            merged_colors = {**(current_theme.get("colors") or {}), **incoming_colors}
            draft.theme = {**current_theme, **incoming_theme, "colors": merged_colors}

        if "sections" in serializer.validated_data:
            draft.sections = serializer.validated_data["sections"]

        draft.created_by = request.user
        draft.save()
        return Response(AppearanceVersionSerializer(draft).data)


class PreviewVersionView(APIView):
    """Prévisualisation d'une version (brouillon ou historique) sans publication.

    Renvoie le même format que /api/site-config/ mais avec le snapshot de la
    version ciblée ; les items de menu et blocs footer restent ceux du live."""

    permission_classes = [IsSuperAdmin]

    def get(self, request, pk):
        version = get_object_or_404(AppearanceVersion, pk=pk)
        return Response(self._build_payload(version, request))

    @staticmethod
    def _build_payload(version, request):
        HomeSection.ensure_defaults()
        return {
            "theme": render_theme_snapshot(version.theme, request),
            "sections": version.sections or [],
            "menu_items": MenuItemSerializer(
                MenuItem.objects.filter(is_visible=True), many=True
            ).data,
            "footer_blocks": FooterBlockSerializer(
                FooterBlock.objects.filter(is_visible=True), many=True
            ).data,
        }


class PublishView(APIView):
    """Publie le brouillon courant : applique son snapshot à la config live."""

    permission_classes = [IsSuperAdmin]

    def post(self, request):
        draft = AppearanceVersion.get_or_create_draft(user=request.user)
        draft.publish(user=request.user)
        return Response(AppearanceVersionSerializer(draft).data)


class HistoryView(APIView):
    """Liste l'historique des versions d'apparence (brouillon + publiées)."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        versions = AppearanceVersion.objects.all()
        return Response(AppearanceVersionSerializer(versions, many=True).data)


class RestoreView(APIView):
    """Restaure une version : crée une **nouvelle** version publiée à partir du
    snapshot choisi (l'historique est préservé)."""

    permission_classes = [IsSuperAdmin]

    def post(self, request, pk):
        source = get_object_or_404(AppearanceVersion, pk=pk)
        restored = AppearanceVersion.objects.create(
            theme=source.theme,
            sections=source.sections,
            status=AppearanceVersion.Status.DRAFT,
            created_by=request.user,
        )
        restored.publish(user=request.user)
        return Response(
            AppearanceVersionSerializer(restored).data,
            status=status.HTTP_201_CREATED,
        )
