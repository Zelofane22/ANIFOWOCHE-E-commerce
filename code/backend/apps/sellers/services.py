"""Services métier des abonnements vendeurs (pipeline E9).

Création d'un abonnement FedaPay (checkout), activation après webhook APPROVED
(avec bascule du plan du vendeur), et rétrogradation automatique après expiration.
Le flux est conçu pour être idempotent : le webhook et le polling de confirmation
peuvent se croiser sans déclencher deux fois la bascule de plan.
"""
import logging
import math

from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from apps.payments.services import FedaPayClient, FedaPayError

from .limits import PLAN_LIMITS, PLAN_ORDER
from .models import SellerProfile, SellerSubscription

logger = logging.getLogger(__name__)

# Durée d'un abonnement payant (mensuel).
SUBSCRIPTION_DURATION_DAYS = 30

REMINDER_WINDOW_DAYS = 7
REMINDER_MIN_INTERVAL_DAYS = 2

# Plans souscriptibles en ligne (FREE et BUSINESS sont exclus du checkout).
SUBSCRIPTABLE_PLANS = (SellerProfile.Plan.STARTER, SellerProfile.Plan.PRO)

MIN_UPGRADE_AMOUNT_XOF = 100  # TODO: vérifier le minimum FedaPay

# Statuts d'abonnement que le vendeur peut relancer lui-même (paiement non abouti).
RELAUNCHABLE_SUBSCRIPTION_STATUSES = (
    SellerSubscription.Status.FAILED,
    SellerSubscription.Status.DECLINED,
    SellerSubscription.Status.CANCELED,
)


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


def get_active_subscription(seller):
    """Dernier abonnement APPROVED non expiré dont le plan == seller.plan, sinon None."""
    return (
        SellerSubscription.objects.filter(
            seller=seller,
            status=SellerSubscription.Status.APPROVED,
            ends_at__gt=timezone.now(),
            plan=seller.plan,
        )
        .order_by("-ends_at")
        .first()
    )


def compute_quote(seller, plan):
    """Devis d'un changement de plan (prorata d'upgrade ANIF Seller).

    Retourne dict {plan, full_price_xof, credit_xof, amount_xof, remaining_days,
    ends_at, is_upgrade}. Lève SubscriptionError si le plan n'est pas
    souscriptible ou en cas de rétrogradation.
    """
    if plan not in SUBSCRIPTABLE_PLANS:
        raise SubscriptionError("Ce plan n'est pas souscriptible en ligne.")
    now = timezone.now()
    active = get_active_subscription(seller)
    if active is None or seller.plan == SellerProfile.Plan.FREE:
        amount = plan_price_for(seller, plan)
        return {
            "plan": plan,
            "full_price_xof": amount,
            "credit_xof": 0,
            "amount_xof": amount,
            "remaining_days": 0,
            "ends_at": None,
            "is_upgrade": False,
        }
    if PLAN_ORDER.index(plan) < PLAN_ORDER.index(seller.plan):
        raise SubscriptionError(
            "La rétrogradation s'effectue à l'expiration de votre abonnement."
        )
    if plan == seller.plan:
        amount = plan_price_for(seller, plan)
        return {
            "plan": plan,
            "full_price_xof": amount,
            "credit_xof": 0,
            "amount_xof": amount,
            "remaining_days": 0,
            "ends_at": None,
            "is_upgrade": False,
        }
    remaining = active.ends_at - now
    ratio = remaining.total_seconds() / (SUBSCRIPTION_DURATION_DAYS * 86400)
    ratio = min(max(ratio, 0.0), 1.0)
    full = PLAN_LIMITS[plan]["price_xof"]
    credit = active.amount_xof
    amount = max(math.ceil((full - credit) * ratio), MIN_UPGRADE_AMOUNT_XOF)
    return {
        "plan": plan,
        "full_price_xof": full,
        "credit_xof": credit,
        "amount_xof": amount,
        "remaining_days": remaining.days,
        "ends_at": active.ends_at,
        "is_upgrade": True,
    }


def create_subscription(seller, plan):
    """Crée un abonnement PENDING pour un plan souscriptible et initie FedaPay.

    Lève SubscriptionError si le plan n'est pas souscriptible ou si l'initiation
    FedaPay échoue (l'abonnement est alors marqué FAILED pour l'audit).
    """
    if plan not in SUBSCRIPTABLE_PLANS:
        raise SubscriptionError("Ce plan n'est pas souscriptible en ligne.")
    quote = compute_quote(seller, plan)

    subscription = SellerSubscription.objects.create(
        seller=seller,
        plan=plan,
        amount_xof=quote["amount_xof"],
        is_upgrade=quote["is_upgrade"],
        ends_at=quote["ends_at"],
        status=SellerSubscription.Status.PENDING,
    )
    try:
        start_fedapay_subscription(subscription)
    except FedaPayError as exc:
        subscription.status = SellerSubscription.Status.FAILED
        subscription.save(update_fields=["status", "updated_at"])
        raise SubscriptionError(f"Échec de l'initiation du paiement : {exc}") from exc
    return subscription


def relaunch_subscription(subscription):
    """Relance le paiement d'un abonnement échoué, refusé ou annulé.

    Crée un nouvel abonnement PENDING (même plan, même montant) et initie une
    nouvelle transaction FedaPay. La ligne d'origine est conservée pour l'audit,
    comme pour la relance d'un paiement de commande.
    """
    if subscription.status not in RELAUNCHABLE_SUBSCRIPTION_STATUSES:
        raise SubscriptionError(
            "Seuls les abonnements échoués, refusés ou annulés peuvent être relancés."
        )
    if subscription.plan not in SUBSCRIPTABLE_PLANS:
        raise SubscriptionError("Ce plan n'est pas souscriptible en ligne.")

    if subscription.is_upgrade:
        quote = compute_quote(subscription.seller, subscription.plan)
        amount_xof = quote["amount_xof"]
        is_upgrade = quote["is_upgrade"]
        ends_at = quote["ends_at"]
    else:
        amount_xof = subscription.amount_xof
        is_upgrade = False
        ends_at = None

    new_subscription = SellerSubscription.objects.create(
        seller=subscription.seller,
        plan=subscription.plan,
        amount_xof=amount_xof,
        is_upgrade=is_upgrade,
        ends_at=ends_at,
        status=SellerSubscription.Status.PENDING,
    )
    try:
        start_fedapay_subscription(new_subscription)
    except FedaPayError as exc:
        new_subscription.status = SellerSubscription.Status.FAILED
        new_subscription.save(update_fields=["status", "updated_at"])
        raise SubscriptionError(f"Échec de l'initiation du paiement : {exc}") from exc
    return new_subscription


def activate_subscription(subscription):

    """Active un abonnement approuvé : bornes temporelles + bascule du plan."""
    now = timezone.now()
    subscription.status = SellerSubscription.Status.APPROVED
    if subscription.is_upgrade and subscription.ends_at and subscription.ends_at > now:
        subscription.starts_at = now
        subscription.save(update_fields=["status", "starts_at", "updated_at"])
    else:
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
    from apps.notifications.services import notify_subscription_downgraded

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
            try:
                notify_subscription_downgraded(subscription)
            except Exception:
                logger.exception("Email de rétrogradation non envoyé (abonnement #%s).", subscription.pk)
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
        if subscription.cancel_requested_at:
            notify_subscription_expiring(subscription, days_left, canceled=True)
        else:
            notify_subscription_expiring(subscription, days_left)
        subscription.last_expiry_reminder_at = now
        subscription.save(update_fields=["last_expiry_reminder_at"])
        sent += 1
    return sent


def cancel_subscription(subscription):
    """Résilie un abonnement approuvé (accès conservé jusqu'à l'échéance).

    Lève SubscriptionError si l'abonnement n'est pas approuvé, s'il est déjà
    expiré, ou si une résiliation est déjà en cours. Ne touche ni au plan du
    vendeur ni au statut de l'abonnement.
    """
    now = timezone.now()
    if subscription.status != SellerSubscription.Status.APPROVED:
        raise SubscriptionError("Seul un abonnement actif peut être résilié.")
    if subscription.ends_at and subscription.ends_at <= now:
        raise SubscriptionError("Cet abonnement est déjà expiré.")
    if subscription.cancel_requested_at is not None:
        raise SubscriptionError("Cet abonnement est déjà en cours de résiliation.")

    subscription.cancel_requested_at = now
    subscription.save(update_fields=["cancel_requested_at", "updated_at"])

    from apps.notifications.services import notify_subscription_canceled

    try:
        notify_subscription_canceled(subscription)
    except Exception:
        logger.exception("Email de résiliation non envoyé (abonnement #%s).", subscription.pk)
    return subscription


def reactivate_subscription(subscription):
    """Annule une demande de résiliation (réactive l'abonnement).

    Lève SubscriptionError si aucune résiliation n'est en cours ou si
    l'abonnement a déjà expiré.
    """
    now = timezone.now()
    if subscription.cancel_requested_at is None:
        raise SubscriptionError("Aucune résiliation n'est en cours pour cet abonnement.")
    if subscription.ends_at and subscription.ends_at <= now:
        raise SubscriptionError("Cet abonnement a déjà expiré, il ne peut pas être réactivé.")

    subscription.cancel_requested_at = None
    subscription.save(update_fields=["cancel_requested_at", "updated_at"])
    return subscription


def active_sellers_analytics():
    """Métrique d'adoption du SaaS : vendeurs actifs, total et taux d'activation.

    Un « vendeur actif » est un profil vendeur possédant au moins un abonnement
    actuellement actif : approuvé (APPROVED), sans demande de résiliation
    (``cancel_requested_at`` vide) et non expiré (bornes temporelles couvrant
    l'instant présent). Voir ``SellerSubscription.is_currently_active``.

    Retourne un dict prêt à être sérialisé :
    ``{active_sellers, total_sellers, activation_rate}``.
    """
    now = timezone.now()
    active_sellers = (
        SellerSubscription.objects.filter(
            status=SellerSubscription.Status.APPROVED,
            cancel_requested_at__isnull=True,
            starts_at__lte=now,
            ends_at__gte=now,
        )
        .values("seller_id")
        .distinct()
        .count()
    )
    total_sellers = SellerProfile.objects.count()
    activation_rate = (
        round(active_sellers / total_sellers * 100, 1) if total_sellers else 0
    )
    return {
        "active_sellers": active_sellers,
        "total_sellers": total_sellers,
        "activation_rate": activation_rate,
    }
