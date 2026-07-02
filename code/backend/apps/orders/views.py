from rest_framework import permissions, viewsets

from .models import Order
from .serializers import OrderSerializer


class OrderViewSet(viewsets.ModelViewSet):
    """Les commandes nécessitent un compte client ; un client authentifié ne
    consulte que ses propres commandes ; la modification/suppression
    (dashboard admin) reste réservée au staff, qui voit toutes les commandes."""

    queryset = Order.objects.all().prefetch_related("items__product")
    serializer_class = OrderSerializer
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_permissions(self):
        if self.action == "create":
            return [permissions.IsAuthenticated()]
        if self.action in ("update", "partial_update", "destroy"):
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_authenticated and not user.is_staff:
            return qs.filter(customer=user)
        return qs
