from rest_framework import permissions, viewsets

from .models import Order
from .serializers import OrderSerializer


class OrderViewSet(viewsets.ModelViewSet):
    """La création (checkout invité) est ouverte ; la consultation et la
    gestion des commandes (dashboard admin) sont réservées au staff."""

    queryset = Order.objects.all().prefetch_related("items__product")
    serializer_class = OrderSerializer
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]
