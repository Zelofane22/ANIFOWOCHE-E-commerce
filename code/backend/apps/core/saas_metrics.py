"""Métriques du SaaS ANIF Seller (abonnements, boutiques vendeur, activation).

Regroupées ici pour être partagées entre le tableau de bord admin
(apps.core.dashboard) et la page Rapports (apps.core.views), sans dupliquer
la logique MRR / churn / activation / mix de plans.
"""

from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncDate

from apps.orders.models import Order
from apps.products.models import Product
from apps.sellers.models import SellerProfile, SellerSubscription, Shop

PLAN_LABELS = dict(SellerProfile.Plan.choices)

ACTIVATION_MIN_PRODUCTS = 5
ACTIVATION_MIN_ORDERS = 3

# Boutique « entreprise » : exempte des limites et exclue des métriques vendeur.
VENDOR_SHOPS = Shop.objects.exclude(is_official=True)


def percent_change(current, previous):
    """Variation en pourcentage entre deux périodes (None si pas de référence)."""
    if not previous:
        return None
    return round((current - previous) / previous * 100, 1)


def plan_breakdown(queryset, plan_field):
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


def activation_stats(vendor_sellers):
    """Vendeurs « activés » : >= 5 produits publiés et >= 3 commandes non annulées."""
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


def paying_vendor_ids(as_of):
    """IDs des vendeurs ayant un abonnement approuvé actif à un instant donné."""
    return set(
        SellerSubscription.objects.filter(
            status=SellerSubscription.Status.APPROVED,
            starts_at__lte=as_of,
            ends_at__gte=as_of,
        ).values_list("seller_id", flat=True)
    )


def current_mrr(as_of):
    """MRR : somme du dernier abonnement actif de chaque vendeur payant (dédupliqué)."""
    active_subs = (
        SellerSubscription.objects.filter(
            status=SellerSubscription.Status.APPROVED,
            starts_at__lte=as_of,
            ends_at__gte=as_of,
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


def build_saas_report(start, end):
    """Construit les métriques SaaS ANIF Seller sur la période [start, end).

    ``start`` et ``end`` sont des datetimes. Compare à la période précédente de
    même durée (revenus et nouveaux abonnements) et calcule le MRR / churn à la
    fin de la période.
    """
    duration = end - start
    previous_start = start - duration

    period_subs = SellerSubscription.objects.filter(
        status=SellerSubscription.Status.APPROVED,
        created_at__gte=start,
        created_at__lt=end,
    )
    previous_subs = SellerSubscription.objects.filter(
        status=SellerSubscription.Status.APPROVED,
        created_at__gte=previous_start,
        created_at__lt=start,
    )

    revenue = period_subs.aggregate(total=Sum("amount_xof"))["total"] or 0
    revenue_previous = previous_subs.aggregate(total=Sum("amount_xof"))["total"] or 0

    subscriptions_approved = period_subs.count()
    subscriptions_approved_previous = previous_subs.count()
    subscriptions_created = SellerSubscription.objects.filter(
        created_at__gte=start, created_at__lt=end
    ).count()

    paying_vendors = period_subs.values("seller").distinct().count()
    arpu = round(revenue / paying_vendors) if paying_vendors else None

    mrr = current_mrr(end)

    active_start = paying_vendor_ids(start)
    active_end = paying_vendor_ids(end)
    churned_vendors_count = len(active_start - active_end)
    churn_rate = (
        round(churned_vendors_count / len(active_start) * 100, 1)
        if active_start else None
    )

    vendor_shops = VENDOR_SHOPS
    shops_total = vendor_shops.count()
    shops_created = vendor_shops.filter(created_at__gte=start, created_at__lt=end).count()

    vendor_sellers = SellerProfile.objects.exclude(shop__is_official=True)
    activation_total, activation_activated, activation_rate = activation_stats(vendor_sellers)

    revenue_by_day = (
        period_subs.annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(total=Sum("amount_xof"))
        .order_by("day")
    )

    return {
        "revenue": revenue,
        "revenue_previous": revenue_previous,
        "revenue_change": percent_change(revenue, revenue_previous),
        "subscriptions_approved": subscriptions_approved,
        "subscriptions_approved_previous": subscriptions_approved_previous,
        "subscriptions_change": percent_change(
            subscriptions_approved, subscriptions_approved_previous
        ),
        "subscriptions_created": subscriptions_created,
        "paying_vendors": paying_vendors,
        "arpu": arpu,
        "mrr": mrr,
        "churn_rate": churn_rate,
        "churned_vendors_count": churned_vendors_count,
        "active_vendors_start_count": len(active_start),
        "plan_mix": plan_breakdown(period_subs, "plan"),
        "shops_total": shops_total,
        "shops_created": shops_created,
        "activation_vendors_total": activation_total,
        "activation_vendors_activated": activation_activated,
        "activation_rate": activation_rate,
        "sales_by_day": [
            {"day": row["day"].strftime("%d/%m"), "total": row["total"]}
            for row in revenue_by_day
        ],
        "recent_subscriptions": SellerSubscription.objects.select_related("seller").order_by("-created_at")[:10],
    }
