"""Services métier des paniers abandonnés (relance email).

Un panier est synchronisé depuis le frontend dès qu'un email est connu, puis
relancé par email s'il n'est pas finalisé après un délai configurable.
"""
import logging

from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from apps.products.models import Product
from apps.sellers.limits import main_store_catalog_q

from .models import AbandonedCart

logger = logging.getLogger(__name__)


def _resolve_products(items):
    """Résout les produits du panier contre le catalogue live (mêmes contrôles
    de disponibilité que le panier actuel : produit actif + visible sur le
    catalogue principal). Retourne un dict {slug: product}."""
    slugs = {
        item.get("slug")
        for item in items
        if isinstance(item, dict) and item.get("slug")
    }
    if not slugs:
        return {}
    products = (
        Product.objects.filter(slug__in=slugs, is_active=True)
        .filter(main_store_catalog_q())
        .select_related("category", "seller", "shop")
        .prefetch_related("option_groups__options")
    )
    return {product.slug: product for product in products}


def _normalize_options(product, selected_options):
    """Reconstruit les options choisies avec les prix issus de la base (le
    client ne fait pas foi pour les montants). Une option introuvable est
    écartée (contrôle de disponibilité)."""
    if not selected_options:
        return []
    groups = {str(group.id): group for group in product.option_groups.all()}
    normalized = []
    for selected in selected_options:
        if not isinstance(selected, dict):
            continue
        group = groups.get(str(selected.get("group_id", "")))
        if group is None:
            continue
        option_id = str(selected.get("option_id", ""))
        option = next((o for o in group.options.all() if str(o.id) == option_id), None)
        if option is None:
            continue
        normalized.append({
            "group_id": group.id,
            "group_name": group.name,
            "option_id": option.id,
            "option_name": option.name,
            "price_xof": option.price_xof,
        })
    return normalized


def _build_item_snapshot(item, product, request=None):
    """Construit le snapshot minimal nécessaire au rappel du panier (sans
    stocker de données personnelles superflues)."""
    image = product.image.url if product.image else ""
    if image and request is not None:
        image = request.build_absolute_uri(image)
    return {
        "id": product.id,
        "slug": product.slug,
        "name": product.name,
        "image": image,
        "price_xof": product.price_xof,
        "quantity": max(int(item.get("quantity", 1)), 1),
        "color_name": item.get("color_name", ""),
        "color_hex": item.get("color_hex", ""),
        "selected_options": _normalize_options(product, item.get("selected_options", [])),
        "delivery_method": item.get("delivery_method", "delivery"),
    }


def sync_abandoned_cart(*, email, items, customer=None, request=None):
    """Crée ou met à jour le panier abandonné d'un email donné.

    Ignore silencieusement (retourne None) si l'email est absent ou si aucun
    article valide ne subsiste après contrôle de disponibilité. Ne crée jamais
    de doublon pour le même panier actif (email + boutique).
    """
    email = (email or "").strip().lower()
    if not email:
        return None
    if not isinstance(items, list) or not items:
        return None

    products_by_slug = _resolve_products(items)
    snapshot = []
    shop = None
    for item in items:
        if not isinstance(item, dict):
            continue
        product = products_by_slug.get(item.get("slug"))
        if product is None:
            continue
        if shop is None:
            shop = product.shop or (product.seller.shop if product.seller else None)
        snapshot.append(_build_item_snapshot(item, product, request=request))

    if not snapshot:
        return None

    existing = (
        AbandonedCart.objects.filter(
            email=email,
            shop=shop,
            status=AbandonedCart.Status.ACTIVE,
        )
        .order_by("-updated_at")
        .first()
    )
    if existing:
        existing.items = snapshot
        if customer is not None:
            existing.customer = customer
        existing.save(update_fields=["items", "customer", "updated_at"])
        return existing

    return AbandonedCart.objects.create(
        email=email,
        customer=customer,
        shop=shop,
        items=snapshot,
    )


def mark_abandoned_cart_converted(*, email, customer=None):
    """Passe à « converti » les paniers abandonnés actifs de cet email (une
    commande correspondante a été créée) : aucune relance ne sera envoyée."""
    if not email:
        return 0
    return AbandonedCart.objects.filter(
        email__iexact=email.strip(),
        status=AbandonedCart.Status.ACTIVE,
    ).update(status=AbandonedCart.Status.CONVERTED)


def estimated_total_xof(items):
    """Montant estimé d'un snapshot de panier (prix + options × quantité)."""
    total = 0
    for item in items or []:
        options = sum(opt.get("price_xof", 0) for opt in item.get("selected_options", []))
        total += (item.get("price_xof", 0) + options) * item.get("quantity", 1)
    return total


def send_abandoned_cart_reminders():
    """Relance par email les paniers abandonnés éligibles.

    Éligible : actif, jamais relancé, non vide, dernière activité antérieure au
    délai configuré, et sans commande correspondante créée depuis. Idempotent :
    ``reminder_sent_at`` n'est posé qu'après succès Resend ; les erreurs sont
    journalisées sans interrompre les autres envois. Retourne le nombre d'envois.
    """
    from apps.notifications.services import notify_abandoned_cart
    from .models import Order

    delay_hours = getattr(settings, "ABANDONED_CART_DELAY_HOURS", 2)
    cutoff = timezone.now() - timedelta(hours=delay_hours)

    candidates = (
        AbandonedCart.objects.filter(
            status=AbandonedCart.Status.ACTIVE,
            reminder_sent_at__isnull=True,
            updated_at__lte=cutoff,
        )
        .select_related("shop")
        .order_by("updated_at")
    )

    sent = 0
    for cart in candidates:
        if not cart.items:
            continue
        # Vérification de dernière minute : aucune commande créée depuis pour cet email.
        if Order.objects.filter(email__iexact=cart.email, created_at__gte=cart.created_at).exists():
            cart.status = AbandonedCart.Status.CONVERTED
            cart.save(update_fields=["status", "updated_at"])
            logger.info("Panier abandonné #%s converti (commande existante).", cart.pk)
            continue

        try:
            delivered = notify_abandoned_cart(cart)
        except Exception:
            logger.exception("Relance panier abandonné #%s non envoyée.", cart.pk)
            continue

        if not delivered:
            continue

        cart.reminder_sent_at = timezone.now()
        if cart.abandoned_at is None:
            cart.abandoned_at = cart.reminder_sent_at
        cart.save(update_fields=["reminder_sent_at", "abandoned_at", "updated_at"])
        sent += 1

    return sent
