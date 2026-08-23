"""Services métier des abonnements vendeurs (pipeline E9).

Création d'un abonnement FedaPay (checkout), activation après webhook APPROVED
(avec bascule du plan du vendeur), et rétrogradation automatique après expiration.
Le flux est conçu pour être idempotent : le webhook et le polling de confirmation
peuvent se croiser sans déclencher deux fois la bascule de plan.
"""
import logging

from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from apps.payments.services import FedaPayClient, FedaPayError

from .limits import PLAN_LIMITS
from .models import SellerProfile, SellerSubscription

logger = logging.getLogger(__name__)

# Durée d'un abonnement payant (mensuel).
SUBSCRIPTION_DURATION_DAYS = 30

REMINDER_WINDOW_DAYS = 7
REMINDER_MIN_INTERVAL_DAYS = 2

# Plans souscriptibles en ligne (FREE et BUSINESS sont exclus du checkout).
SUBSCRIPTABLE_PLANS = (SellerProfile.Plan.STARTER, SellerProfile.Plan.PRO)


class SubscriptionError(Exception):
    """Erreur métier de souscription (plan invalide, échec FedaPay…)."""


def start_fedapay_subscription(subscription):
    """Crée la transaction FedaPay et le lien de paiement d'un abonnement.

    Enregistre fedapay_transaction_id et payment_url sur l'abonnement.
    Propage FedaPayError sans toucher au statut : l'appelant décide.
    """
    seller = subscription.seller
    client = FedaPayClient()
    transaction = client.create_transaction(
        amount_xof=subscription.amount_xof,
        description=f"Abonnement ANIF Seller {subscription.get_plan_display()}",
        callback_url=_seller_plan_url(),
        customer_phone=seller.phone,
        customer_email=getattr(seller.user, "email", ""),
    )
    transaction_id = transaction.get("id") or transaction.get("v1/transaction", {}).get("id")
    subscription.fedapay_transaction_id = str(transaction_id) if transaction_id else ""

    token_data = client.generate_token(transaction_id) if transaction_id else {}
    subscription.payment_url = token_data.get("url", "")
    subscription.save(update_fields=["fedapay_transaction_id", "payment_url", "updated_at"])
    return subscription


def _seller_plan_url():
    """URL de retour du checkout FedaPay vers la page plan du vendeur."""
    base = getattr(settings, "SELLER_FRONTEND_BASE_URL", None) or settings.FRONTEND_BASE_URL
    return f"{base.rstrip('/')}/plan"


def starter_launch_price(seller):
    """Prix du plan Starter pour ce vendeur (tarif de lancement ou de référence).

    Les 3 premiers mois d'abonnement Starter sont facturés au tarif de lancement
    (``promo_price_xof``), puis au prix de référence (``price_xof``). Le compteur
    repose sur les abonnements Starter créés par le vendeur (APPROVED uniquement,
    pour éviter qu'un abonnement PENDING/FAILED ne consume le tarif promo).
    """
    limits = PLAN_LIMITS["STARTER"]
    promo_months = limits.get("promo_duration_months") or 0
    promo_price = limits.get("promo_price_xof")
    if promo_price is None or promo_months <= 0:
        return limits["price_xof"]
    approved_starter = SellerSubscription.objects.filter(
        seller=seller,
        plan=SellerProfile.Plan.STARTER,
        status=SellerSubscription.Status.APPROVED,
    ).count()
    return promo_price if approved_starter < promo_months else limits["price_xof"]


def plan_price_for(seller, plan):
    """Prix effectif d'un plan pour ce vendeur (tarif promo Starter appliqué)."""
    limits = PLAN_LIMITS[plan]
    if plan == SellerProfile.Plan.STARTER:
        return starter_launch_price(seller)
    return limits["price_xof"]


def create_subscription(seller, plan):
    """Crée un abonnement PENDING pour un plan souscriptible et initie FedaPay.

    Lève SubscriptionError si le plan n'est pas souscriptible ou si l'initiation
    FedaPay échoue (l'abonnement est alors marqué FAILED pour l'audit).
    """
    if plan not in SUBSCRIPTABLE_PLANS:
        raise SubscriptionError("Ce plan n'est pas souscriptible en ligne.")
    limits = PLAN_LIMITS.get(plan)
    price_xof = plan_price_for(seller, plan)
    if not limits["price_xof"] and not price_xof:
        raise SubscriptionError("Ce plan n'est pas souscriptible en ligne.")

    subscription = SellerSubscription.objects.create(
        seller=seller,
        plan=plan,
        amount_xof=price_xof,
        status=SellerSubscription.Status.PENDING,
    )
    try:
        start_fedapay_subscription(subscription)
    except FedaPayError as exc:
        subscription.status = SellerSubscription.Status.FAILED
        subscription.save(update_fields=["status", "updated_at"])
        raise SubscriptionError(f"Échec de l'initiation du paiement : {exc}") from exc
    return subscription


def activate_subscription(subscription):
    """Active un abonnement approuvé : bornes temporelles + bascule du plan."""
    now = timezone.now()
    subscription.status = SellerSubscription.Status.APPROVED
    subscription.starts_at = now
    subscription.ends_at = now + timedelta(days=SUBSCRIPTION_DURATION_DAYS)
    subscription.save(update_fields=["status", "starts_at", "ends_at", "updated_at"])

    # Bascule du plan du vendeur (no-op si déjà sur ce plan : idempotent).
    seller = subscription.seller
    if seller.plan != subscription.plan:
        seller.plan = subscription.plan
        seller.save(update_fields=["plan", "updated_at"])
        logger.info("Vendeur #%s passé au plan %s (abonnement #%s).", seller.pk, subscription.plan, subscription.pk)


def apply_subscription_status(subscription, new_status, webhook_payload=None):
    """Applique un statut final FedaPay à un abonnement (idempotent).

    Sur APPROVED, active l'abonnement (bornes + bascule plan). Retourne True si
    le statut a réellement changé. Le payload du webhook est conservé pour l'audit.
    """
    if subscription.status == new_status and webhook_payload is None:
        return False

    changed = subscription.status != new_status
    subscription.status = new_status
    update_fields = ["status", "updated_at"]
    if webhook_payload is not None:
        subscription.last_webhook_payload = webhook_payload
        update_fields.append("last_webhook_payload")
    subscription.save(update_fields=update_fields)

    if new_status == SellerSubscription.Status.APPROVED:
        activate_subscription(subscription)
    return changed


def expire_subscriptions():
    """Rétrograde au plan FREE les vendeurs dont l'abonnement payant a expiré.

    Un vendeur est rétrogradé uniquement si son plan actuel correspond à celui
    de l'abonnement expiré (il peut avoir souscrit à un nouveau plan entre-temps).
    Retourne le nombre de vendeurs rétrogradés.
    """
    now = timezone.now()
    expired = (
        SellerSubscription.objects
        .filter(status=SellerSubscription.Status.APPROVED, ends_at__lt=now)
        .select_related("seller")
    )
    downgraded = 0
    for subscription in expired:
        seller = subscription.seller
        if seller.plan == subscription.plan:
            seller.plan = SellerProfile.Plan.FREE
            seller.save(update_fields=["plan", "updated_at"])
            downgraded += 1
            logger.info("Vendeur #%s rétrogradé au plan FREE (abonnement #%s expiré).", seller.pk, subscription.pk)
    return downgraded


def remind_expiring_subscriptions():
    """Envoie un rappel email aux vendeurs dont l'abonnement approuvé expire
    dans les REMINDER_WINDOW_DAYS jours, au maximum une fois tous les
    REMINDER_MIN_INTERVAL_DAYS jours (1 jour sur 2)."""
    from apps.notifications.services import notify_subscription_expiring

    now = timezone.now()
    window_end = now + timedelta(days=REMINDER_WINDOW_DAYS)
    min_interval = timedelta(days=REMINDER_MIN_INTERVAL_DAYS)

    candidates = SellerSubscription.objects.filter(
        status=SellerSubscription.Status.APPROVED,
        ends_at__gt=now,
        ends_at__lte=window_end,
    ).select_related("seller__user")

    sent = 0
    for subscription in candidates:
        if (
            subscription.last_expiry_reminder_at is not None
            and now - subscription.last_expiry_reminder_at < min_interval
        ):
            continue
        days_left = max((subscription.ends_at - now).days, 0)
        notify_subscription_expiring(subscription, days_left)
        subscription.last_expiry_reminder_at = now
        subscription.save(update_fields=["last_expiry_reminder_at"])
        sent += 1
    return sent
