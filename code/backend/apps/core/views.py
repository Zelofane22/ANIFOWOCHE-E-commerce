import csv
import io
import json
from datetime import datetime, timedelta

from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from django.contrib import admin
from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import F, Sum
from django.db.models.functions import TruncDate
from django.http import HttpResponse
from django.shortcuts import render
from django.urls import reverse
from django.utils import timezone

from apps.core.models import SettingChangeRequest
from apps.notifications.models import NotificationSettings
from apps.orders.models import Order, OrderItem
from apps.payments.models import PaymentSettings
from apps.products.models import Product

from .models import StoreSettings

REPORT_PERIODS = {"7": 7, "30": 30, "90": 90}

def _report_period(request):
    period = request.GET.get("period", "30")
    today = timezone.localdate()
    if period == "custom":
        try:
            start_date = datetime.strptime(request.GET["start"], "%Y-%m-%d").date()
            end_date = datetime.strptime(request.GET["end"], "%Y-%m-%d").date()
            if start_date <= end_date:
                return period, start_date, end_date
        except (KeyError, TypeError, ValueError):
            pass
        period = "30"
    days = REPORT_PERIODS.get(period, REPORT_PERIODS["30"])
    return period, today - timedelta(days=days - 1), today

def _percent_change(current, previous):
    if not previous:
        return None
    return round((current - previous) / previous * 100, 1)


class StoreStatusView(APIView):
    """Lecture publique de l'état de la boutique (Sprint 6) : mode maintenance
    et moyens de paiement actifs — le frontend s'en sert pour adapter le
    checkout, sans exposer le mécanisme de demande/validation lui-même."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Lit l'état courant de la boutique et des moyens de paiement.
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
    period, start_date, end_date = _report_period(request)
    start = timezone.make_aware(datetime.combine(start_date, datetime.min.time()))
    end = timezone.make_aware(datetime.combine(end_date + timedelta(days=1), datetime.min.time()))
    duration = end - start
    previous_start = start - duration
    previous_end = start
    valid_orders = Order.objects.filter(created_at__gte=start, created_at__lt=end).exclude(status=Order.Status.CANCELLED)
    previous_valid_orders = Order.objects.filter(created_at__gte=previous_start, created_at__lt=previous_end).exclude(status=Order.Status.CANCELLED)
    revenue_by_month = valid_orders.annotate(day=TruncDate("created_at")).values("day").annotate(total=Sum("total_xof")).order_by("day")
    top_products = OrderItem.objects.filter(order__created_at__gte=start, order__created_at__lt=end).exclude(order__status=Order.Status.CANCELLED).annotate(subtotal=F("quantity") * F("unit_price_xof")).values("product__name").annotate(total_revenue=Sum("subtotal"), total_quantity=Sum("quantity")).order_by("-total_revenue")[:10]
    category_breakdown = OrderItem.objects.filter(order__created_at__gte=start, order__created_at__lt=end).exclude(order__status=Order.Status.CANCELLED).annotate(subtotal=F("quantity") * F("unit_price_xof")).values("product__category__name").annotate(total=Sum("subtotal")).order_by("-total")
    revenue = valid_orders.aggregate(total=Sum("total_xof"))["total"] or 0
    previous_revenue = previous_valid_orders.aggregate(total=Sum("total_xof"))["total"] or 0
    order_count = valid_orders.count()
    previous_order_count = previous_valid_orders.count()
    if request.GET.get("export") == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Rapport de ventes", f"{start_date:%d/%m/%Y} - {end_date:%d/%m/%Y}"])
        writer.writerow([])
        writer.writerow(["Evolution du chiffre d'affaires", "Montant (FCFA)"])
        writer.writerows([[row["day"].strftime("%d/%m/%Y"), row["total"]] for row in revenue_by_month])
        writer.writerow([])
        writer.writerow(["Produit", "Quantite vendue", "Chiffre d'affaires (FCFA)"])
        writer.writerows([[row["product__name"], row["total_quantity"], row["total_revenue"]] for row in top_products])
        writer.writerow([])
        writer.writerow(["Categorie", "Chiffre d'affaires (FCFA)"])
        writer.writerows([[row["product__category__name"] or "Autres", row["total"]] for row in category_breakdown])
        response = HttpResponse(output.getvalue(), content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = f"attachment; filename=rapports-{start_date:%Y%m%d}-{end_date:%Y%m%d}.csv"
        return response
    context = {
        **admin.site.each_context(request),
        "title": "Rapports",
        "revenue_by_month": [{"month": row["day"].strftime("%d/%m/%Y"), "total": row["total"]} for row in revenue_by_month],
        "top_products": list(top_products),
        "category_breakdown": list(category_breakdown),
        "total_products": Product.objects.filter(is_active=True).count(),
        "period": period,
        "period_start": start_date.isoformat(),
        "period_end": end_date.isoformat(),
        "period_label": f"du {start_date:%d/%m/%Y} au {end_date:%d/%m/%Y}",
        "revenue": revenue,
        "revenue_change": _percent_change(revenue, previous_revenue),
        "order_count": order_count,
        "order_count_change": _percent_change(order_count, previous_order_count),
        "revenue_chart_labels_json": json.dumps([row["day"].strftime("%d/%m") for row in revenue_by_month]),
        "revenue_chart_values_json": json.dumps([row["total"] for row in revenue_by_month]),
        "category_labels_json": json.dumps([row["product__category__name"] or "Autres" for row in category_breakdown]),
        "category_values_json": json.dumps([row["total"] for row in category_breakdown]),
    }
    return render(request, "admin/reports.html", context)



@staff_member_required
def settings_hub_view(request):
    """Page « Réglages boutique » de l'admin : état des réglages et demandes en attente."""
    # Lecture des réglages singleton de la boutique, des paiements et des notifications.
    store_settings = StoreSettings.get_solo()
    payment_settings = PaymentSettings.get_solo()
    notification_settings = NotificationSettings.get_solo()

    # Demandes de changement encore en attente de validation.
    pending_requests = SettingChangeRequest.objects.filter(status=SettingChangeRequest.Status.PENDING)

    # Assemblage du contexte et des liens admin de la page.
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
