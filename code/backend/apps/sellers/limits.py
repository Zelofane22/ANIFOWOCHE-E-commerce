"""Limites des plans vendeurs par palier (FREE/STARTER/PRO/BUSINESS).

Règles métier (cf. docs/.../04-modele-economique.md) :
- FREE : 5 produits actifs max, 5 commandes reçues par mois max ; produits
  jamais visibles sur le catalogue principal (anifowoche.com).
- STARTER : 100 produits actifs max, commandes illimitées.
- PRO/BUSINESS : produits et commandes illimités.
- Fonctionnalités par offre (PLAN_FEATURES) : la matrice sert au frontend pour
  masquer/afficher les modules payants (stats, exports, équipe, promotions,
  relances, domaine, paiement en ligne, multi-boutiques, support prioritaire).
- Quota de commandes atteint : la boutique publique est masquée jusqu'au mois
  suivant (sans basculer ``is_published``, pour une réouverture automatique).
- La boutique principale (entreprise, slug ``MAIN_STORE_SLUG``) n'est jamais
  soumise aux limites, quel que soit le plan de son vendeur.
"""

from django.db.models import Q
from django.utils import timezone


PLAN_LIMITS = {
    "FREE": {"max_products": 5, "max_orders_per_month": 5, "price_xof": 0},
    # STARTER : tarif de lancement à 2 000 F/mois pendant les 3 premiers mois,
    # puis prix de référence à 5 000 F/mois (cf. docs/.../04-modele-economique.md).
    "STARTER": {
        "max_products": 100,
        "max_orders_per_month": None,
        "price_xof": 5000,
        "promo_price_xof": 2000,
        "promo_duration_months": 3,
    },
    "PRO": {"max_products": None, "max_orders_per_month": None, "price_xof": 10000},
    "BUSINESS": {"max_products": None, "max_orders_per_month": None, "price_xof": None},
}

# Fonctionnalités incluses par offre (cf. modèle économique « Tarification par offre »).
# Quelques repères :
# - FREE : vitrine publique (identité ANIF), bouton WhatsApp, gestion basique des
#   commandes. Aucune fonctionnalité payante.
# - STARTER : vendre simplement → personnalisation de base, statistiques
#   essentielles, paiement en ligne.
# - PRO : mieux vendre et piloter → personnalisation avancée, statistiques
#   avancées, exports, équipe, outils promotionnels, relances clients, domaine
#   personnalisé, paiement en ligne.
# - BUSINESS : structurer → tout le PRO + multi-boutiques + support prioritaire.
PRO_FEATURES = frozenset(
    {
        "basic_customization",
        "advanced_customization",
        "essential_stats",
        "advanced_stats",
        "exports",
        "team",
        "promotions",
        "client_relaunch",
        "custom_domain",
        "online_payment",
    }
)
PLAN_FEATURES = {
    "FREE": frozenset(),
    "STARTER": frozenset(
        {"basic_customization", "essential_stats", "online_payment"}
    ),
    "PRO": PRO_FEATURES,
    "BUSINESS": PRO_FEATURES | frozenset({"multi_store", "priority_support"}),
}


def plan_limits(seller):
    """Limites du palier du vendeur (fallback FREE si valeur inconnue)."""
    return PLAN_LIMITS.get(seller.plan, PLAN_LIMITS["FREE"])


def plan_features(seller):
    """Fonctionnalités du palier du vendeur (fallback FREE si valeur inconnue)."""
    return PLAN_FEATURES.get(seller.plan, PLAN_FEATURES["FREE"])


def _is_main_store(seller):
    """True si la boutique du vendeur est la boutique entreprise (exempte)."""
    shop = getattr(seller, "shop", None)
    return shop is not None and shop.is_official


def is_free(seller):
    """True si le vendeur est soumis aux limites du plan gratuit.

    La boutique principale (entreprise) est toujours exempte, même si son
    vendeur est resté sur le plan FREE par défaut.
    """
    if seller.plan != seller.Plan.FREE:
        return False
    return not _is_main_store(seller)


def has_feature(seller, feature):
    """True si le palier donne accès à la fonctionnalité (boutique entreprise
    exempte : toutes les fonctionnalités lui sont accordées)."""
    if _is_main_store(seller):
        return True
    return feature in plan_features(seller)


def plan_feature_flags(seller):
    """Dict booléen de toutes les fonctionnalités connues pour le palier.

    Exposé au frontend via le bloc ``limits`` pour masquer/afficher les modules
    payants. La boutique entreprise reçoit toutes les fonctionnalités.
    """
    all_features = sorted(PLAN_FEATURES["BUSINESS"])
    if _is_main_store(seller):
        return {feature: True for feature in all_features}
    granted = plan_features(seller)
    return {feature: feature in granted for feature in all_features}


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
    if _is_main_store(seller):
        return True
    max_products = plan_limits(seller)["max_products"]
    return max_products is None or active_product_count(seller) < max_products


def orders_quota_reached(seller):
    """True si le vendeur a atteint son quota mensuel de commandes."""
    shop = getattr(seller, "shop", None)
    if _is_main_store(seller):
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
    company = Q(**{f"{prefix}shop__is_official": True}) | Q(
        **{f"{prefix}seller__shop__is_official": True}
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
        "features": plan_feature_flags(seller),
    }
