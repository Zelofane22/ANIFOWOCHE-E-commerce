import json
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import F, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone

from apps.analytics.models import PageView
from apps.orders.models import Order, OrderItem
from apps.payments.models import Payment
from apps.products.models import Product

User = get_user_model()

PERIOD_DAYS = 30
LOW_STOCK_THRESHOLD = 10


def _percent_change(current, previous):
    if not previous:
        return None
    return round((current - previous) / previous * 100, 1)


def dashboard_callback(request, context):
    now = timezone.now()
    period_start = now - timedelta(days=PERIOD_DAYS)
    previous_start = now - timedelta(days=2 * PERIOD_DAYS)

    orders_period = Order.objects.filter(created_at__gte=period_start)
    orders_previous = Order.objects.filter(created_at__gte=previous_start, created_at__lt=period_start)

    revenue_period = orders_period.exclude(status=Order.Status.CANCELLED).aggregate(total=Sum("total_xof"))["total"] or 0
    revenue_previous = orders_previous.exclude(status=Order.Status.CANCELLED).aggregate(total=Sum("total_xof"))["total"] or 0

    orders_count = orders_period.count()
    orders_count_previous = orders_previous.count()

    clients_qs = User.objects.filter(is_staff=False)
    clients_total = clients_qs.count()
    clients_new_period = clients_qs.filter(date_joined__gte=period_start).count()
    clients_new_previous = clients_qs.filter(date_joined__gte=previous_start, date_joined__lt=period_start).count()

    products_qs = Product.objects.filter(is_active=True)
    products_total = products_qs.count()
    products_new_period = products_qs.filter(created_at__gte=period_start).count()
    products_new_previous = products_qs.filter(created_at__gte=previous_start, created_at__lt=period_start).count()

    visits_period = PageView.objects.filter(created_at__gte=period_start).count()
    visits_previous = PageView.objects.filter(created_at__gte=previous_start, created_at__lt=period_start).count()

    sales_by_day = (
        orders_period.exclude(status=Order.Status.CANCELLED)
        .annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(total=Sum("total_xof"))
        .order_by("day")
    )

    category_breakdown = (
        OrderItem.objects.filter(order__created_at__gte=period_start)
        .exclude(order__status=Order.Status.CANCELLED)
        .annotate(subtotal=F("quantity") * F("unit_price_xof"))
        .values("product__category__name")
        .annotate(total=Sum("subtotal"))
        .order_by("-total")
    )
    category_total = sum(row["total"] for row in category_breakdown) or 1
    category_breakdown = list(category_breakdown)

    top_products = (
        OrderItem.objects.filter(order__created_at__gte=period_start)
        .exclude(order__status=Order.Status.CANCELLED)
        .annotate(subtotal=F("quantity") * F("unit_price_xof"))
        .values("product__id", "product__name")
        .annotate(total_revenue=Sum("subtotal"), total_quantity=Sum("quantity"))
        .order_by("-total_revenue")[:5]
    )

    context.update(
        {
            "kpi_revenue": revenue_period,
            "kpi_revenue_change": _percent_change(revenue_period, revenue_previous),
            "kpi_orders": orders_count,
            "kpi_orders_change": _percent_change(orders_count, orders_count_previous),
            "kpi_clients": clients_total,
            "kpi_clients_change": _percent_change(clients_new_period, clients_new_previous),
            "kpi_products": products_total,
            "kpi_products_change": _percent_change(products_new_period, products_new_previous),
            "kpi_visits": visits_period,
            "kpi_visits_change": _percent_change(visits_period, visits_previous),
            "sales_chart_labels_json": json.dumps([row["day"].strftime("%d/%m") for row in sales_by_day]),
            "sales_chart_values_json": json.dumps([row["total"] for row in sales_by_day]),
            "category_breakdown": [
                {
                    "name": row["product__category__name"] or "Autres",
                    "total": row["total"],
                    "percent": round(row["total"] / category_total * 100, 1),
                }
                for row in category_breakdown
            ],
            "category_breakdown_labels_json": json.dumps(
                [row["product__category__name"] or "Autres" for row in category_breakdown]
            ),
            "category_breakdown_values_json": json.dumps([row["total"] for row in category_breakdown]),
            "recent_orders": Order.objects.order_by("-created_at")[:5],
            "top_products": list(top_products),
            "low_stock_products": Product.objects.filter(
                is_active=True, stock__lte=LOW_STOCK_THRESHOLD
            ).order_by("stock")[:5],
            "recent_payments": Payment.objects.select_related("order").order_by("-created_at")[:5],
            "period_days": PERIOD_DAYS,
        }
    )
    return context
