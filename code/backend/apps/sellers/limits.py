"""Limites des plans vendeurs par palier (FREE/STARTER/PRO/BUSINESS).

Règles métier (cf. page vendeur « Tarifs ») :
- FREE : 10 produits actifs max, 20 commandes reçues par mois max ; produits
  jamais visibles sur le catalogue principal (anifowoche.com).
- STARTER/PRO/BUSINESS : montent en palier (voir PLAN_LIMITS).
- Quota de commandes atteint : la boutique publique est masquée jusqu'au mois
  suivant (sans basculer ``is_published``, pour une réouverture automatique).
- La boutique principale (entreprise, slug ``MAIN_STORE_SLUG``) n'est jamais
  soumise aux limites, quel que soit le plan de son vendeur.
"""

from django.db.models import Q
from django.utils import timezone

from apps.core.store_scope import get_main_store_slug

PLAN_LIMITS = {
    "FREE": {"max_products": 10, "max_orders_per_month": 20, "price_xof": 0},
    "STARTER": {"max_products": 100, "max_orders_per_month": None, "price_xof": 3000},
    "PRO": {"max_products": None, "max_orders_per_month": None, "price_xof": 10000},
    "BUSINESS": {"max_products": None, "max_orders_per_month": None, "price_xof": None},
}


def plan_limits(seller):
    """Limites du palier du vendeur (fallback FREE si valeur inconnue)."""
    return PLAN_LIMITS.get(seller.plan, PLAN_LIMITS["FREE"])


def is_free(seller):
    """True si le vendeur est soumis aux limites du plan gratuit.

    La boutique principale (entreprise) est toujours exempte, même si son
    vendeur est resté sur le plan FREE par défaut.
    """
    if seller.plan != seller.Plan.FREE:
        return False
    shop = getattr(seller, "shop", None)
    return not (shop is not None and shop.slug == get_main_store_slug())


def active_product_count(seller):
    """Nombre de produits actifs du vendeur (les archivés ne comptent pas)."""
    return seller.products.filter(is_active=True).count()


def month_bounds(reference=None):
    """Bornes [début, fin) du mois courant dans le fuseau horaire Django."""
    now = reference or timezone.localtime()
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if start.month == 12:
        end = start.replace(year=start.year + 1, month=1)
    else:
        end = start.replace(month=start.month + 1)
    return start, end


def orders_this_month_count(seller):
    """Commandes distinctes du vendeur créées ce mois-ci (hors annulées)."""
    from apps.orders.models import Order  # Import local : évite le cycle sellers ↔ orders.

    start, end = month_bounds()
    return (
        Order.objects.filter(
            items__product__seller=seller,
            created_at__gte=start,
            created_at__lt=end,
        )
        .exclude(status=Order.Status.CANCELLED)
        .distinct()
        .count()
    )


def can_create_product(seller):
    """True si le vendeur peut encore créer ou réactiver un produit actif."""
    shop = getattr(seller, "shop", None)
    if shop is not None and shop.slug == get_main_store_slug():
        return True
    max_products = plan_limits(seller)["max_products"]
    return max_products is None or active_product_count(seller) < max_products


def orders_quota_reached(seller):
    """True si le vendeur a atteint son quota mensuel de commandes."""
    shop = getattr(seller, "shop", None)
    if shop is not None and shop.slug == get_main_store_slug():
        return False
    max_orders = plan_limits(seller)["max_orders_per_month"]
    return max_orders is not None and orders_this_month_count(seller) >= max_orders


def is_public_shop_visible(shop):
    """Boutique visible publiquement : publiée ET quota commandes non atteint."""
    return shop.is_published and not orders_quota_reached(shop.seller)


def main_store_catalog_q(prefix=""):
    """Filtre Q des produits visibles sur le catalogue principal (anifowoche.com).

    Visibles : les produits de la boutique entreprise, et ceux des vendeurs
    payants (STARTER/PRO/BUSINESS) dont la boutique est marquée « visible sur
    la vitrine principale » (ou sans boutique). Les produits des vendeurs FREE
    tiers en sont exclus.

    ``prefix`` permet d'utiliser le filtre depuis un modèle lié (ex. « product__ »
    pour la wishlist).
    """
    from apps.sellers.models import SellerProfile  # Import local : évite tout cycle.

    # Boutique entreprise : via la boutique du produit ou celle de son vendeur
    # (miroir de l'exemption de is_free).
    company = Q(**{f"{prefix}shop__slug": get_main_store_slug()}) | Q(
        **{f"{prefix}seller__shop__slug": get_main_store_slug()}
    )
    third_party = (
        (
            Q(**{f"{prefix}shop__isnull": True})
            | Q(**{f"{prefix}shop__visible_on_main_store": True})
        )
        & (
            Q(**{f"{prefix}seller__isnull": True})
            | ~Q(**{f"{prefix}seller__plan": SellerProfile.Plan.FREE})
        )
    )
    return company | third_party


def build_limits_payload(seller):
    """Bloc « limits » exposé au frontend (dashboard, produits, paramètres)."""
    shop = getattr(seller, "shop", None)
    limits = plan_limits(seller)
    free = is_free(seller)
    return {
        "plan": seller.plan,
        "max_products": limits["max_products"],
        "max_orders_per_month": limits["max_orders_per_month"],
        "price_xof": limits["price_xof"],
        "products_used": active_product_count(seller),
        "orders_this_month": orders_this_month_count(seller),
        "orders_quota_reached": orders_quota_reached(seller),
        "public_shop_visible": is_public_shop_visible(shop) if shop else False,
        "can_appear_on_main_store": bool(shop and not free),
    }
