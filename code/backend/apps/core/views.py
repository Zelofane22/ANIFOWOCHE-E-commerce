from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from django.contrib import admin
from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import F, Sum
from django.db.models.functions import TruncMonth
from django.shortcuts import render

from apps.orders.models import Order, OrderItem
from apps.payments.models import PaymentSettings
from apps.products.models import Product

from .models import StoreSettings


class StoreStatusView(APIView):
    """Lecture publique de l'état de la boutique (Sprint 6) : mode maintenance
    et moyens de paiement actifs — le frontend s'en sert pour adapter le
    checkout, sans exposer le mécanisme de demande/validation lui-même."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        store_settings = StoreSettings.get_solo()
        payment_settings = PaymentSettings.get_solo()
        return Response(
            {
                "maintenance_mode": store_settings.maintenance_mode,
                "online_payment_enabled": payment_settings.online_payment_enabled,
                "payment_methods": {
                    "mtn": payment_settings.mtn_enabled,
                    "moov": payment_settings.moov_enabled,
                    "card": payment_settings.card_enabled,
                },
            }
        )


@staff_member_required
def reports_view(request):
    revenue_by_month = (
        Order.objects.exclude(status=Order.Status.CANCELLED)
        .annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(total=Sum("total_xof"))
        .order_by("month")
    )

    top_products = (
        OrderItem.objects.exclude(order__status=Order.Status.CANCELLED)
        .annotate(subtotal=F("quantity") * F("unit_price_xof"))
        .values("product__name")
        .annotate(total_revenue=Sum("subtotal"), total_quantity=Sum("quantity"))
        .order_by("-total_revenue")[:10]
    )

    category_breakdown = (
        OrderItem.objects.exclude(order__status=Order.Status.CANCELLED)
        .annotate(subtotal=F("quantity") * F("unit_price_xof"))
        .values("product__category__name")
        .annotate(total=Sum("subtotal"))
        .order_by("-total")
    )

    context = {
        **admin.site.each_context(request),
        "title": "Rapports",
        "revenue_by_month": [
            {"month": row["month"].strftime("%B %Y"), "total": row["total"]} for row in revenue_by_month
        ],
        "top_products": list(top_products),
        "category_breakdown": list(category_breakdown),
        "total_products": Product.objects.filter(is_active=True).count(),
    }
    return render(request, "admin/reports.html", context)
