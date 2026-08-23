import json
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count, F, Q, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from django.urls import reverse

from apps.core.models import SettingChangeRequest
from apps.orders.models import Order, OrderItem
from apps.payments.models import Payment
from apps.products.models import Product
from apps.sellers.models import SellerSubscription, SellerProfile, Shop

from apps.core.store_scope import (
    get_main_store_shop,
    scoped_clients,
    scoped_orders,
    scoped_products,
    scoped_visits,
)

User = get_user_model()

PERIOD_DAYS = 30
LOW_STOCK_THRESHOLD = 10


def _percent_change(current, previous):
    """Calcule la variation en pourcentage entre deux périodes (None si pas de référence)."""
    if not previous:
        return None
    return round((current - previous) / previous * 100, 1)


PLAN_LABELS = dict(SellerProfile.Plan.choices)


def _plan_breakdown(queryset, plan_field):
    """Regroupe un queryset par plan vendeur, avec libellés lisibles."""
    rows = (
        queryset.values(plan_field)
        .annotate(count=Count("id", distinct=True))
        .order_by(plan_field)
    )
    return [
        {
            "plan": PLAN_LABELS.get(row[plan_field], row[plan_field] or "Sans plan"),
            "count": row["count"],
        }
        for row in rows
    ]

ACTIVATION_MIN_PRODUCTS = 5
ACTIVATION_MIN_ORDERS = 3


def _activation_stats(vendor_sellers):
    """Vendeurs « activés » : >= 5 produits publiés et >= 3 commande non annulée."""
    activation_qs = vendor_sellers.annotate(
        published_products_count=Count(
            "products", filter=Q(products__is_active=True), distinct=True
        ),
        orders_count=Count(
            "products__order_items__order",
            filter=~Q(products__order_items__order__status=Order.Status.CANCELLED),
            distinct=True,
        ),
    )
    total = activation_qs.count()
    activated = activation_qs.filter(
        published_products_count__gte=ACTIVATION_MIN_PRODUCTS,
        orders_count__gte=ACTIVATION_MIN_ORDERS,
    ).count()
    rate = round(activated / total * 100, 1) if total else None
    return total, activated, rate


def _paying_vendor_ids(as_of):
    """IDs des vendeurs ayant un abonnement approuvé actif à un instant donné."""
    return set(
        SellerSubscription.objects.filter(
            status=SellerSubscription.Status.APPROVED,
            starts_at__lte=as_of,
            ends_at__gte=as_of,
        ).values_list("seller_id", flat=True)
    )


def _current_mrr(now):
    """MRR : somme du dernier abonnement actif de chaque vendeur payant (dédupliqué)."""
    active_subs = (
        SellerSubscription.objects.filter(
            status=SellerSubscription.Status.APPROVED,
            starts_at__lte=now,
            ends_at__gte=now,
        )
        .order_by("seller_id", "-starts_at")
    )
    seen_sellers = set()
    total = 0
    for sub in active_subs:
        if sub.seller_id in seen_sellers:
            continue
        seen_sellers.add(sub.seller_id)
        total += sub.amount_xof
    return total


def dashboard_callback(request, context):
    """Callback de l'admin Django : injecte les KPIs du tableau de bord dans le contexte.

    Seules les statistiques de la boutique principale (ets-anifowoche) sont
    affichées : commandes, produits, clients et visites sont scopés à cette
    boutique (voir apps.core.store_scope).
    """
    # Boutique principale (entreprise) et périmètre des données.
    main_shop = get_main_store_shop()
    store_orders = scoped_orders(main_shop)
    store_products = scoped_products(main_shop)
    store_clients = scoped_clients(main_shop)
    store_visits = scoped_visits(main_shop)

    # Bornes temporelles des deux périodes comparées (actuelle et précédente).
    now = timezone.now()
    period_start = now - timedelta(days=PERIOD_DAYS)
    previous_start = now - timedelta(days=2 * PERIOD_DAYS)

    orders_period = store_orders.filter(created_at__gte=period_start)
    orders_previous = store_orders.filter(created_at__gte=previous_start, created_at__lt=period_start)

    revenue_period = orders_period.exclude(status=Order.Status.CANCELLED).aggregate(total=Sum("total_xof"))["total"] or 0
    revenue_previous = orders_previous.exclude(status=Order.Status.CANCELLED).aggregate(total=Sum("total_xof"))["total"] or 0

    subs_period = SellerSubscription.objects.filter(
        status=SellerSubscription.Status.APPROVED, created_at__gte=period_start
    )
    subs_previous = SellerSubscription.objects.filter(
        status=SellerSubscription.Status.APPROVED,
        created_at__gte=previous_start, created_at__lt=period_start,
    )
    seller_revenue_period = subs_period.aggregate(total=Sum("amount_xof"))["total"] or 0
    seller_revenue_previous = subs_previous.aggregate(total=Sum("amount_xof"))["total"] or 0

    orders_count = orders_period.count()
    orders_count_previous = orders_previous.count()

    clients_total = store_clients.count()
    clients_new_period = store_clients.filter(date_joined__gte=period_start).count()
    clients_new_previous = store_clients.filter(date_joined__gte=previous_start, date_joined__lt=period_start).count()

    products_qs = store_products.filter(is_active=True)
    products_total = products_qs.count()
    products_new_period = products_qs.filter(created_at__gte=period_start).count()
    products_new_previous = products_qs.filter(created_at__gte=previous_start, created_at__lt=period_start).count()

    visits_period = store_visits.filter(created_at__gte=period_start).count()
    visits_previous = store_visits.filter(created_at__gte=previous_start, created_at__lt=period_start).count()

    sales_by_day = (
        orders_period.exclude(status=Order.Status.CANCELLED)
        .annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(total=Sum("total_xof"))
        .order_by("day")
    )

    period_order_items = OrderItem.objects.filter(order__in=orders_period)

    category_breakdown = (
        period_order_items.exclude(order__status=Order.Status.CANCELLED)
        .annotate(subtotal=F("quantity") * F("unit_price_xof"))
        .values("product__category__name")
        .annotate(total=Sum("subtotal"))
        .order_by("-total")
    )
    category_total = sum(row["total"] for row in category_breakdown) or 1
    category_breakdown = list(category_breakdown)

    top_products = (
        period_order_items.exclude(order__status=Order.Status.CANCELLED)
        .annotate(subtotal=F("quantity") * F("unit_price_xof"))
        .values("product__id", "product__name")
        .annotate(total_revenue=Sum("subtotal"), total_quantity=Sum("quantity"))
        .order_by("-total_revenue")[:5]
    )

    # Données « centre d'actions » : listes récentes, produits sous seuil,
    # paiements échoués et demandes de réglages en attente.
    recent_orders = store_orders.select_related("delivery_zone").order_by("-created_at")[:5]
    low_stock_products = list(
        products_qs.filter(stock__lte=LOW_STOCK_THRESHOLD, made_to_order=False)
        .order_by("stock")[:5]
    )
    low_stock_count = products_qs.filter(
        stock__lte=LOW_STOCK_THRESHOLD, made_to_order=False
    ).count()
    recent_payments = Payment.objects.filter(order__in=store_orders).select_related("order").order_by("-created_at")[:5]
    pending_orders_count = store_orders.filter(
        status__in=[Order.Status.RECEIVED, Order.Status.PREPARED]
    ).count()
    failed_payments_count = Payment.objects.filter(
        order__in=store_orders,
        status__in=[Payment.Status.FAILED, Payment.Status.DECLINED, Payment.Status.CANCELED],
    ).count()
    pending_settings_count = SettingChangeRequest.objects.filter(
        status=SettingChangeRequest.Status.PENDING
    ).count()

    # KPIs plateforme ANIF Seller : tous vendeurs, hors boutique officielle.
    vendor_shops = Shop.objects.exclude(is_official=True)
    vendor_products = Product.objects.filter(is_active=True, shop__is_official=False)
    vendor_orders = Order.objects.filter(items__product__shop__is_official=False).distinct()

    platform_shops_total = vendor_shops.count()
    platform_shops_by_plan = _plan_breakdown(vendor_shops, "seller__plan")

    platform_products_total = vendor_products.count()
    platform_products_by_plan = _plan_breakdown(vendor_products, "shop__seller__plan")

    platform_orders_total = vendor_orders.count()
    platform_orders_by_plan = _plan_breakdown(vendor_orders, "items__product__shop__seller__plan")

    # Taux d'activation : vendeurs hors boutique officielle.
    vendor_sellers = SellerProfile.objects.exclude(shop__is_official=True)
    activation_vendors_total, activation_vendors_activated, activation_rate = _activation_stats(
        vendor_sellers
    )

    # Mix des plans (vendeurs hors boutique officielle).
    plan_mix = _plan_breakdown(vendor_sellers, "plan")

    # ARPU : revenu abonnements de la période / vendeurs payants distincts de la période.
    paying_vendors_period_count = subs_period.values("seller").distinct().count()
    arpu = (
        round(seller_revenue_period / paying_vendors_period_count)
        if paying_vendors_period_count else None
    )

    # MRR : somme du dernier abonnement actif de chaque vendeur, à l'instant présent.
    mrr = _current_mrr(now)

    # Churn mensuel : vendeurs payants actifs il y a 30 jours qui n'ont pas renouvelé.
    vendors_active_period_start = _paying_vendor_ids(period_start)
    vendors_active_now = _paying_vendor_ids(now)
    churned_vendors_count = len(vendors_active_period_start - vendors_active_now)
    churn_rate = (
        round(churned_vendors_count / len(vendors_active_period_start) * 100, 1)
        if vendors_active_period_start else None
    )

    # Liens « liste filtrée » pour rendre chaque carte et ligne actionnables.
    action_links = {
        "orders": reverse("admin:orders_order_changelist"),
        "orders_pending": "{}?to_process=1".format(reverse("admin:orders_order_changelist")),
        "products": reverse("admin:products_product_changelist"),
        "products_low_stock": "{}?low_stock=1".format(reverse("admin:products_product_changelist")),
        "payments": reverse("admin:payments_payment_changelist"),
        "payments_failed": "{}?relaunch=1".format(reverse("admin:payments_payment_changelist")),
        "settings": reverse("admin:core_settingchangerequest_changelist"),
        "settings_pending": "{}?status__exact=pending".format(
            reverse("admin:core_settingchangerequest_changelist")
        ),
        "clients": reverse("admin:users_client_changelist"),
        "visits": reverse("admin:analytics_pageview_changelist"),
        "seller_subscriptions": reverse("admin:sellers_sellersubscription_changelist"),
        "reports": reverse("admin_reports"),
    }

    context.update(
        {
            "kpi_revenue": revenue_period,
            "kpi_revenue_change": _percent_change(revenue_period, revenue_previous),
            "kpi_seller_revenue": seller_revenue_period,
            "kpi_seller_revenue_change": _percent_change(seller_revenue_period, seller_revenue_previous),
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
            "recent_orders": recent_orders,
            "top_products": list(top_products),
            "low_stock_products": low_stock_products,
            "recent_payments": recent_payments,
            "pending_orders_count": pending_orders_count,
            "low_stock_count": low_stock_count,
            "low_stock_threshold": LOW_STOCK_THRESHOLD,
            "failed_payments_count": failed_payments_count,
            "pending_settings_count": pending_settings_count,
            "platform_shops_total": platform_shops_total,
            "platform_shops_by_plan": platform_shops_by_plan,
            "platform_products_total": platform_products_total,
            "platform_products_by_plan": platform_products_by_plan,
            "platform_orders_total": platform_orders_total,
            "platform_orders_by_plan": platform_orders_by_plan,
            "activation_vendors_total": activation_vendors_total,
            "activation_vendors_activated": activation_vendors_activated,
            "activation_rate": activation_rate,
            "activation_min_products": ACTIVATION_MIN_PRODUCTS,
            "activation_min_orders": ACTIVATION_MIN_ORDERS,
            "plan_mix": plan_mix,
            "arpu": arpu,
            "mrr": mrr,
            "churn_rate": churn_rate,
            "churned_vendors_count": churned_vendors_count,
            "vendors_active_period_start_count": len(vendors_active_period_start),
            "action_links": action_links,
            "period_days": PERIOD_DAYS,
        }
    )
    return context
