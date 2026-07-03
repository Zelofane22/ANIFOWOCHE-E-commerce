from rest_framework import permissions, status, viewsets
from rest_framework.response import Response

from .models import WishlistItem
from .serializers import WishlistItemSerializer


class WishlistItemViewSet(viewsets.ModelViewSet):
    """Liste de souhaits personnelle : le client authentifié gère ses propres
    entrées (ajout idempotent, retrait par produit via lookup_field), scoping
    strict sur request.user — aucun accès à la liste d'un autre client."""

    serializer_class = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "delete", "head", "options"]
    lookup_field = "product_id"

    def get_queryset(self):
        return WishlistItem.objects.filter(user=self.request.user).select_related("product")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item, _ = WishlistItem.objects.get_or_create(
            user=request.user, product=serializer.validated_data["product"]
        )
        return Response(self.get_serializer(item).data, status=status.HTTP_201_CREATED)
