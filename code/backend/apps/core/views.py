from django.contrib import admin
from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import F, Sum
from django.db.models.functions import TruncMonth
from django.shortcuts import render

from apps.orders.models import Order, OrderItem
from apps.products.models import Product


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
