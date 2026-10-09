from datetime import timedelta

from django.db.models import Sum
from django.utils import timezone
from django.urls import reverse

from apps.core.models import SettingChangeRequest
from apps.orders.models import Order
from apps.products.models import Product
from apps.sellers.models import SellerSubscription, SellerProfile, Shop

from apps.core.saas_metrics import (
    ACTIVATION_MIN_ORDERS,
    ACTIVATION_MIN_PRODUCTS,
    activation_stats,
    current_mrr,
    paying_vendor_ids,
    percent_change,
    plan_breakdown,
)
from apps.core.store_scope import (
    get_main_store_shop,
    scoped_clients,
    scoped_visits,
)

PERIOD_DAYS = 30


def dashboard_callback(request, context):
    """Callback de l'admin Django : injecte les KPIs du tableau de bord dans le contexte.

    Backoffice centré sur le SaaS ANIF Seller : plateforme (boutiques, produits,
    commandes vendeur, activation), business (mix des plans, ARPU, MRR, churn)
    et transactions d'abonnement. Les statistiques de boutique (ventes, commandes,
    produits, stock) restent dans l'espace seller de chaque boutique.
    """
    # Périmètre : comptes clients et visites non rattachés aux boutiques tierces.
    main_shop = get_main_store_shop()
    store_clients = scoped_clients(main_shop)
    store_visits = scoped_visits(main_shop)

    # Bornes temporelles des deux périodes comparées (actuelle et précédente).
    now = timezone.now()
    period_start = now - timedelta(days=PERIOD_DAYS)
    previous_start = now - timedelta(days=2 * PERIOD_DAYS)

    subs_period = SellerSubscription.objects.filter(
        status=SellerSubscription.Status.APPROVED, created_at__gte=period_start
    )
    subs_previous = SellerSubscription.objects.filter(
        status=SellerSubscription.Status.APPROVED,
        created_at__gte=previous_start, created_at__lt=period_start,
    )
    seller_revenue_period = subs_period.aggregate(total=Sum("amount_xof"))["total"] or 0
    seller_revenue_previous = subs_previous.aggregate(total=Sum("amount_xof"))["total"] or 0

    clients_total = store_clients.count()
    clients_new_period = store_clients.filter(date_joined__gte=period_start).count()
    clients_new_previous = store_clients.filter(date_joined__gte=previous_start, date_joined__lt=period_start).count()

    visits_period = store_visits.filter(created_at__gte=period_start).count()
    visits_previous = store_visits.filter(created_at__gte=previous_start, created_at__lt=period_start).count()

    # Transactions SaaS : derniers abonnements + abonnements en attente de paiement.
    recent_subscriptions = SellerSubscription.objects.select_related("seller").order_by("-created_at")[:5]
    pending_subscriptions_count = SellerSubscription.objects.filter(
        status=SellerSubscription.Status.PENDING
    ).count()
    pending_settings_count = SettingChangeRequest.objects.filter(
        status=SettingChangeRequest.Status.PENDING
    ).count()

    # KPIs plateforme ANIF Seller : tous vendeurs, hors boutique officielle.
    vendor_shops = Shop.objects.exclude(is_official=True)
    vendor_products = Product.objects.filter(is_active=True, shop__is_official=False)
    vendor_orders = Order.objects.filter(items__product__shop__is_official=False).distinct()

    platform_shops_total = vendor_shops.count()
    platform_shops_by_plan = plan_breakdown(vendor_shops, "seller__plan")

    platform_products_total = vendor_products.count()
    platform_products_by_plan = plan_breakdown(vendor_products, "shop__seller__plan")

    platform_orders_total = vendor_orders.count()
    platform_orders_by_plan = plan_breakdown(vendor_orders, "items__product__shop__seller__plan")

    # Taux d'activation : vendeurs hors boutique officielle.
    vendor_sellers = SellerProfile.objects.exclude(shop__is_official=True)
    activation_vendors_total, activation_vendors_activated, activation_rate = activation_stats(
        vendor_sellers
    )

    # Mix des plans (vendeurs hors boutique officielle).
    plan_mix = plan_breakdown(vendor_sellers, "plan")

    # ARPU : revenu abonnements de la période / vendeurs payants distincts de la période.
    paying_vendors_period_count = subs_period.values("seller").distinct().count()
    arpu = (
        round(seller_revenue_period / paying_vendors_period_count)
        if paying_vendors_period_count else None
    )

    # MRR : somme du dernier abonnement actif de chaque vendeur, à l'instant présent.
    mrr = current_mrr(now)

    # Churn mensuel : vendeurs payants actifs il y a 30 jours qui n'ont pas renouvelé.
    vendors_active_period_start = paying_vendor_ids(period_start)
    vendors_active_now = paying_vendor_ids(now)
    churned_vendors_count = len(vendors_active_period_start - vendors_active_now)
    churn_rate = (
        round(churned_vendors_count / len(vendors_active_period_start) * 100, 1)
        if vendors_active_period_start else None
    )

    # Liens « liste filtrée » pour rendre chaque carte et ligne actionnables.
    action_links = {
        "subscriptions": reverse("admin:sellers_sellersubscription_changelist"),
        "subscriptions_pending": "{}?status__exact=pending".format(
            reverse("admin:sellers_sellersubscription_changelist")
        ),
        "settings_pending": "{}?status__exact=pending".format(
            reverse("admin:core_settingchangerequest_changelist")
        ),
        "clients": reverse("admin:users_client_changelist"),
        "visits": reverse("admin:analytics_pageview_changelist"),
        "seller_subscriptions": reverse("admin:sellers_sellersubscription_changelist"),
    }

    context.update(
        {
            "kpi_seller_revenue": seller_revenue_period,
            "kpi_seller_revenue_change": percent_change(seller_revenue_period, seller_revenue_previous),
            "kpi_clients": clients_total,
            "kpi_clients_change": percent_change(clients_new_period, clients_new_previous),
            "kpi_visits": visits_period,
            "kpi_visits_change": percent_change(visits_period, visits_previous),
            "recent_subscriptions": recent_subscriptions,
            "pending_subscriptions_count": pending_subscriptions_count,
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
