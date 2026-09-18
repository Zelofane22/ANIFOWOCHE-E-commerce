from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.models import StoreSettings

from .models import AbandonedCart, Order
from .serializers import AbandonedCartSerializer, OrderSerializer
from .services import sync_abandoned_cart


class OrderViewSet(viewsets.ModelViewSet):
    """Les commandes nécessitent un compte client ; un client authentifié ne
    consulte que ses propres commandes ; la modification/suppression
    (dashboard admin) reste réservée au staff, qui voit toutes les commandes."""

    queryset = Order.objects.all().prefetch_related("items__product")
    serializer_class = OrderSerializer
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_permissions(self):
        # Création ouverte à tous ; modifications/suppressions réservées au staff ; lecture au client connecté.
        if self.action == "create":
            return [permissions.AllowAny()]
        if self.action in ("update", "partial_update", "destroy"):
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        # Refuse les nouvelles commandes pendant la maintenance.
        if StoreSettings.get_solo().maintenance_mode:
            return Response(
                {"detail": "La boutique est temporairement en maintenance. Merci de réessayer plus tard."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return super().create(request, *args, **kwargs)

    def get_queryset(self):
        # Un client ne voit que ses propres commandes ; le staff voit tout.
        qs = super().get_queryset()
        user = self.request.user
        if user.is_authenticated and not user.is_staff:
            return qs.filter(customer=user)
        return qs


class AbandonedCartView(APIView):
    """Synchronise un panier abandonné dès qu'un email est connu.

    POST { email, items: [...] } → crée ou met à jour le panier abandonné.
    Ouvert aux visiteurs anonymes ; l'utilisateur est rattaché s'il est
    authentifié. Ne renvoie jamais l'email ni de données personnelles : seul le
    token (aléatoire) est exposé pour la récupération du panier.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = AbandonedCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        items = serializer.validated_data["items"]
        customer = request.user if request.user.is_authenticated else None

        cart = sync_abandoned_cart(email=email, items=items, customer=customer, request=request)
        if cart is None:
            return Response({"token": None, "status": None, "items": []}, status=status.HTTP_200_OK)

        return Response(
            {
                "token": cart.token,
                "status": cart.status,
                "items": cart.items,
                "shop": cart.shop.name if cart.shop else None,
            },
            status=status.HTTP_200_OK,
        )


class AbandonedCartRetrieveView(APIView):
    """Récupère le contenu d'un panier abandonné via son token de récupération.

    Le token est aléatoire et impossible à deviner ; seul le panier correspondant
    est renvoyé, sans jamais exposer l'email du client.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        cart = AbandonedCart.objects.filter(token=token, status=AbandonedCart.Status.ACTIVE).first()
        if cart is None:
            return Response({"detail": "Lien de récupération invalide ou expiré."}, status=status.HTTP_404_NOT_FOUND)
        return Response(
            {
                "token": cart.token,
                "status": cart.status,
                "items": cart.items,
                "shop": cart.shop.name if cart.shop else None,
            }
        )
