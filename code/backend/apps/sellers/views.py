from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.orders.models import Order
from apps.orders.serializers import OrderSerializer
from apps.users.serializers import UserSerializer

from .models import SellerProfile, Shop
from .serializers import (
    PublicShopSerializer,
    SellerProfileSerializer,
    SellerRegisterSerializer,
)


class SellerRegisterView(generics.CreateAPIView):
    serializer_class = SellerRegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        seller = user.seller_profile
        return Response(
            {
                "user": UserSerializer(user).data,
                "seller": SellerProfileSerializer(seller).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class SellerProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = SellerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        try:
            return self.request.user.seller_profile
        except SellerProfile.DoesNotExist:
            raise NotFound("Aucun profil vendeur n'est associé à ce compte.")


class SellerDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            seller = request.user.seller_profile
        except SellerProfile.DoesNotExist:
            raise NotFound("Aucun profil vendeur n'est associé à ce compte.")

        orders_qs = Order.objects.filter(items__product__seller=seller).distinct()
        today = timezone.localdate()
        orders_today = orders_qs.filter(created_at__date=today).count()
        pending_orders = orders_qs.filter(status=Order.Status.RECEIVED).count()

        return Response(
            {
                "seller": SellerProfileSerializer(seller).data,
                "metrics": {
                    "products": seller.products.filter(is_active=True).count(),
                    "orders_today": orders_today,
                    "pending_orders": pending_orders,
                },
            }
        )


class SellerOrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        try:
            seller = self.request.user.seller_profile
        except SellerProfile.DoesNotExist:
            raise NotFound("Aucun profil vendeur n'est associé à ce compte.")
        return Order.objects.filter(items__product__seller=seller).prefetch_related("items__product").distinct()


class PublicShopView(generics.RetrieveAPIView):
    serializer_class = PublicShopSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        return Shop.objects.filter(is_published=True).select_related("seller")
