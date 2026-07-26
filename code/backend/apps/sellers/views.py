from datetime import timedelta

from django.db.models import Count, F, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.orders.models import Order, OrderItem
from apps.orders.serializers import OrderSerializer
from apps.payments.models import Payment
from apps.payments.serializers import PaymentSerializer
from apps.notifications.services import notify_invoice
from apps.payments.services import PaymentRelaunchError, RELAUNCHABLE_STATUSES, relaunch_payment
from apps.users.serializers import UserSerializer

from .models import SellerProfile, Shop
from .serializers import (
    PublicShopSerializer,
    SellerOrderStatusSerializer,
    SellerProfileSerializer,
    SellerRegisterSerializer,
)

KPI_PERIOD_DAYS = 30
LOW_STOCK_THRESHOLD = 10


def _percent_change(current, previous):
    if not previous:
        return None
    return round((current - previous) / previous * 100, 1)


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

        seller_orders = Order.objects.filter(items__product__seller=seller).distinct()
        seller_products = seller.products.filter(is_active=True)

        now = timezone.now()
        period_start = now - timedelta(days=KPI_PERIOD_DAYS)
        previous_start = now - timedelta(days=2 * KPI_PERIOD_DAYS)

        orders_period = seller_orders.filter(created_at__gte=period_start)
        orders_previous = seller_orders.filter(
            created_at__gte=previous_start, created_at__lt=period_start
        )

        revenue_period = orders_period.exclude(status=Order.Status.CANCELLED).aggregate(total=Sum("total_xof"))["total"] or 0
        revenue_previous = orders_previous.exclude(status=Order.Status.CANCELLED).aggregate(total=Sum("total_xof"))["total"] or 0
        orders_count_period = orders_period.count()
        orders_count_previous = orders_previous.count()

        sales_by_day = (
            orders_period.exclude(status=Order.Status.CANCELLED)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(total=Sum("total_xof"))
            .order_by("day")
        )

        total_revenue = seller_orders.exclude(status=Order.Status.CANCELLED).aggregate(total=Sum("total_xof"))["total"] or 0

        today = timezone.localdate()
        orders_today = seller_orders.filter(created_at__date=today).count()
        pending_orders = seller_orders.filter(status=Order.Status.RECEIVED).count()

        status_distribution = (
            seller_orders.values("status")
            .annotate(count=Count("id"))
            .order_by("status")
        )

        top_products = (
            OrderItem.objects.filter(order__in=seller_orders)
            .exclude(order__status=Order.Status.CANCELLED)
            .values("product__id", "product__name")
            .annotate(total_revenue=Sum(F("quantity") * F("unit_price_xof")), total_quantity=Sum("quantity"))
            .order_by("-total_revenue")[:5]
        )

        category_breakdown = (
            OrderItem.objects.filter(order__in=seller_orders)
            .exclude(order__status=Order.Status.CANCELLED)
            .values("product__category__name")
            .annotate(total=Sum(F("quantity") * F("unit_price_xof")))
            .order_by("-total")
        )

        low_stock = seller_products.filter(stock__lte=LOW_STOCK_THRESHOLD).order_by("stock")[:5]

        recent_orders = seller_orders.prefetch_related("items__product").order_by("-created_at")[:5]

        return Response(
            {
                "seller": SellerProfileSerializer(seller).data,
                "metrics": {
                    "products": seller_products.count(),
                    "orders_today": orders_today,
                    "pending_orders": pending_orders,
                    "total_orders": seller_orders.count(),
                    "total_revenue": total_revenue,
                },
                "kpi": {
                    "revenue": revenue_period,
                    "revenue_change": _percent_change(revenue_period, revenue_previous),
                    "orders": orders_count_period,
                    "orders_change": _percent_change(orders_count_period, orders_count_previous),
                    "period_days": KPI_PERIOD_DAYS,
                },
                "sales_chart": [
                    {"day": row["day"].strftime("%d/%m"), "total": row["total"]}
                    for row in sales_by_day
                ],
                "status_distribution": {row["status"]: row["count"] for row in status_distribution},
                "top_products": [
                    {"id": row["product__id"], "name": row["product__name"], "revenue": row["total_revenue"], "quantity": row["total_quantity"]}
                    for row in top_products
                ],
                "category_breakdown": [
                    {"name": row["product__category__name"] or "Autres", "total": row["total"]}
                    for row in category_breakdown
                ],
                "low_stock": [
                    {"id": p.id, "name": p.name, "stock": p.stock}
                    for p in low_stock
                ],
                "recent_orders": OrderSerializer(recent_orders, many=True).data,
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


class SellerConfirmPaymentView(APIView):
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
            status=Payment.Status.PENDING,
        ).order_by("-created_at").first()
        if not payment:
            return Response(
                {"detail": "Aucun paiement en attente pour cette commande."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment.status = Payment.Status.APPROVED
        payment.save(update_fields=["status"])

        order.status = Order.Status.PREPARED
        order.save(update_fields=["status"])

        notify_invoice(payment)

        return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)
