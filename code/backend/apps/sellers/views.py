from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.orders.models import Order
from apps.orders.serializers import OrderSerializer
from apps.payments.models import Payment
from apps.payments.serializers import PaymentSerializer
from apps.payments.services import PaymentRelaunchError, RELAUNCHABLE_STATUSES, relaunch_payment
from apps.users.serializers import UserSerializer

from .models import SellerProfile, Shop
from .serializers import (
    PublicShopSerializer,
    SellerOrderStatusSerializer,
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


class SellerOrderViewSet(viewsets.ModelViewSet):
    http_method_names = ["get", "patch", "head", "options"]
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ("update", "partial_update"):
            return SellerOrderStatusSerializer
        return OrderSerializer

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


class SellerPaymentRelaunchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        try:
            seller = request.user.seller_profile
        except SellerProfile.DoesNotExist:
            raise NotFound("Aucun profil vendeur n'est associé à ce compte.")

        order = Order.objects.filter(
            pk=order_id,
            items__product__seller=seller,
        ).distinct().first()
        if not order:
            raise NotFound("Commande introuvable.")

        payment = order.payments.filter(
            provider=Payment.Provider.FEDAPAY,
            status__in=RELAUNCHABLE_STATUSES,
        ).order_by("-created_at").first()
        if not payment:
            return Response(
                {"detail": "Aucun paiement relançable pour cette commande."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            new_payment = relaunch_payment(payment)
        except PaymentRelaunchError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(PaymentSerializer(new_payment).data, status=status.HTTP_201_CREATED)
