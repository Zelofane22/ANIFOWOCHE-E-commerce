from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from django.contrib import admin
from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import F, Sum
from django.db.models.functions import TruncMonth
from django.shortcuts import render
from django.urls import reverse

from apps.core.models import SettingChangeRequest
from apps.notifications.models import NotificationSettings
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
                    "cash_on_delivery": payment_settings.cash_on_delivery_enabled,
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


@staff_member_required
def settings_hub_view(request):
    store_settings = StoreSettings.get_solo()
    payment_settings = PaymentSettings.get_solo()
    notification_settings = NotificationSettings.get_solo()

    pending_requests = SettingChangeRequest.objects.filter(status=SettingChangeRequest.Status.PENDING)

    context = {
        **admin.site.each_context(request),
        "title": "Réglages boutique",
        "store_settings": store_settings,
        "payment_settings": payment_settings,
        "notification_settings": notification_settings,
        "pending_requests_count": pending_requests.count(),
        "recent_requests": SettingChangeRequest.objects.select_related("requested_by", "reviewed_by")[:5],
        "links": {
            "store_settings": reverse("admin:core_storesettings_changelist"),
            "payment_settings": reverse("admin:payments_paymentsettings_changelist"),
            "notification_settings": reverse("admin:notifications_notificationsettings_changelist"),
            "setting_requests": reverse("admin:core_settingchangerequest_changelist"),
            "setting_request_add": reverse("admin:core_settingchangerequest_add"),
        },
    }
    return render(request, "admin/settings_hub.html", context)
