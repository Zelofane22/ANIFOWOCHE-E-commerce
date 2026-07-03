from rest_framework import permissions, viewsets

from .models import ReturnRequest
from .serializers import ReturnRequestSerializer


class ReturnRequestViewSet(viewsets.ModelViewSet):
    """Le client authentifié demande un retour sur l'une de ses commandes et
    consulte ses propres demandes ; le traitement (approbation, rejet,
    remboursement) reste réservé à l'admin Django, pas exposé en API."""

    queryset = ReturnRequest.objects.all().select_related("order")
    serializer_class = ReturnRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_authenticated and not user.is_staff:
            return qs.filter(order__customer=user)
        return qs
