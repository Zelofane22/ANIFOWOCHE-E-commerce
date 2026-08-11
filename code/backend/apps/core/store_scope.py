"""Périmètre de la boutique principale pour les statistiques d'administration.

La boutique « ets-anifowoche » est la boutique de l'entreprise : le dashboard
admin et les rapports ne doivent afficher que ses statistiques. Les fonctions
de ce module délimitent ce périmètre (fallback : toutes les données si la
boutique n'existe pas, pour ne jamais casser l'admin).
"""

from django.conf import settings
from django.db.models import Q

from apps.orders.models import Order
from apps.products.models import Product
from apps.sellers.models import Shop

def get_main_store_slug():
    """Slug de la boutique principale (lu dynamiquement pour rester configurable)."""
    return getattr(settings, "MAIN_STORE_SLUG", "ets-anifowoche")


def get_main_store_shop():
    """Retourne la boutique principale (None si introuvable)."""
    return Shop.objects.filter(slug=get_main_store_slug()).first()


def scoped_orders(shop=None):
    """Commandes de la boutique principale (toutes si aucune boutique résolue)."""
    queryset = Order.objects.all()
    if shop is not None:
        queryset = queryset.filter(items__product__shop=shop).distinct()
    return queryset


def scoped_products(shop=None):
    """Produits de la boutique principale (tous si aucune boutique résolue)."""
    queryset = Product.objects.all()
    if shop is not None:
        queryset = queryset.filter(shop=shop)
    return queryset


def scoped_clients(shop=None):
    """Comptes clients inscrits sur la plateforme (utilisateurs non-staff).

    Un compte client n'est rattaché à aucune boutique : le KPI « Clients » du
    dashboard reflète les inscriptions (comme la liste Utilisateurs > Clients
    de l'admin), y compris les clients n'ayant pas encore commandé. Le
    paramètre ``shop`` est accepté par uniformité avec les autres scopes,
    sans effet sur ce compteur.
    """
    from django.contrib.auth import get_user_model

    User = get_user_model()
    return User.objects.filter(is_staff=False)


def scoped_visits(shop=None):
    """Vues de page de la vitrine principale (hors pages des boutiques tierces)."""
    from apps.analytics.models import PageView

    queryset = PageView.objects.all()
    if shop is None:
        return queryset
    exclude_paths = Q()
    for slug in Shop.objects.exclude(pk=shop.pk).values_list("slug", flat=True):
        exclude_paths |= Q(path__startswith=f"/shop/{slug}")
    return queryset.exclude(exclude_paths) if exclude_paths else queryset
