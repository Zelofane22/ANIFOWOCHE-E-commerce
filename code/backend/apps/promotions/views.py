from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Coupon
from .serializers import ValidateCouponSerializer


class ValidateCouponView(APIView):
    """Vérifie qu'un code coupon est utilisable (actif, non expiré, non épuisé)
    sans le consommer — la consommation (used_count) se fait à la création
    de la commande, voir apps.orders.serializers.OrderSerializer."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ValidateCouponSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data["code"].strip()

        coupon = Coupon.objects.filter(code__iexact=code).first() if code else None
        if not coupon or not coupon.is_valid():
            return Response({"detail": "Code coupon invalide ou expiré."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"code": coupon.code, "discount_percent": coupon.discount_percent})
