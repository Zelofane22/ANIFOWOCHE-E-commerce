import hashlib
import hmac
import time

import requests
from django.conf import settings

from apps.notifications.models import BackofficeNotification
from apps.notifications.services import (
    create_backoffice_notification,
    notify_invoice,
    notify_payment_retry,
)
from apps.orders.models import Order

from .models import Payment, PaymentSettings


class FedaPayError(Exception):
    """Erreur technique lors des appels à l'API FedaPay (réseau, HTTP, réponse inattendue)."""


class PaymentRelaunchError(Exception):
    """Relance impossible pour une raison métier (statut, moyen de paiement,
    commande déjà payée…) — distincte d'un échec technique FedaPay."""


# Retry limité aux erreurs réseau transitoires (timeout/connexion) : une erreur
# HTTP 4xx/5xx signale un problème métier à corriger, pas une panne à retenter.
RETRY_DELAYS = (1, 2, 4)
MAX_ATTEMPTS = 3

# Statuts FedaPay (objet transaction récupéré via GET /v1/transactions/{id})
# vers les statuts locaux, pour resynchroniser un paiement dont le webhook
# n'est pas encore arrivé (polling page de confirmation).
FEDAPAY_TRANSACTION_STATUS_MAP = {
    "approved": Payment.Status.APPROVED,
    "declined": Payment.Status.DECLINED,
    "canceled": Payment.Status.CANCELED,
}


class FedaPayClient:
    """Client minimal pour l'API FedaPay (sandbox MTN/Moov + carte).

    Utilise des clés placeholder tant que les vraies clés sandbox ne sont
    pas fournies dans les variables d'environnement (FEDAPAY_SECRET_KEY).
    Voir https://docs.fedapay.com/.
    """

    def __init__(self):
        # Chargement de la configuration FedaPay depuis les variables d'environnement.
        self.base_url = settings.FEDAPAY_BASE_URL.rstrip("/")
        self.api_key = settings.FEDAPAY_SECRET_KEY

    def _headers(self):
        # En-têtes d'authentification Bearer pour l'API FedaPay.
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def _post(self, url, *, error_message, **kwargs):
        """POST avec 3 tentatives sur erreurs réseau (Timeout/ConnectionError)
        uniquement, backoff 1s/2s/4s. Les erreurs HTTP (4xx/5xx) ne sont pas
        retentées : elles signalent un problème à corriger, pas une panne."""
        delays = RETRY_DELAYS
        last_exc = None
        for attempt in range(MAX_ATTEMPTS):
            try:
                response = requests.post(url, **kwargs)
                response.raise_for_status()
                return response
            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as exc:
                last_exc = exc
                if attempt < MAX_ATTEMPTS - 1 and attempt < len(delays):
                    time.sleep(delays[attempt])
            except requests.exceptions.RequestException as exc:
                raise FedaPayError(f"{error_message} : {exc}") from exc
        raise FedaPayError(f"{error_message} : {last_exc}") from last_exc

    def create_transaction(self, *, amount_xof, description, callback_url, customer_phone, customer_email=""):
        # Construction du corps de la transaction (montant, devise, client).
        payload = {
            "description": description,
            "amount": amount_xof,
            "currency": {"iso": "XOF"},
            "callback_url": callback_url,
            "customer": {
                "phone_number": {"number": customer_phone, "country": "bj"},
                "email": customer_email or None,
            },
        }
        response = self._post(
            f"{self.base_url}/v1/transactions",
            error_message="Échec de création de la transaction FedaPay",
            json=payload,
            headers=self._headers(),
            timeout=10,
        )
        return response.json()

    def generate_token(self, transaction_id):
        # Génération du jeton/lien de paiement d'une transaction existante.
        response = self._post(
            f"{self.base_url}/v1/transactions/{transaction_id}/token",
            error_message="Échec de génération du lien de paiement FedaPay",
            headers=self._headers(),
            timeout=10,
        )
        return response.json()

    def get_transaction(self, transaction_id):
        # Récupération de l'état réel d'une transaction (resynchronisation si le
        # webhook n'est pas encore arrivé).
        try:
            response = requests.get(
                f"{self.base_url}/v1/transactions/{transaction_id}",
                headers=self._headers(),
                timeout=10,
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            raise FedaPayError(f"Échec de récupération de la transaction FedaPay : {exc}") from exc
        return response.json()


def verify_webhook_signature(raw_body: bytes, signature_header: str, secret: str) -> bool:
    """Vérifie la signature d'un webhook FedaPay.

    FedaPay envoie un en-tête `X-FEDAPAY-SIGNATURE` au format
    "t=<timestamp>,s=<signature>" où signature = HMAC-SHA256(secret, "<timestamp>.<body>").
    """
    if not signature_header:
        return False

    # Parse l'en-tête de signature en paires clé=valeur.
    parts = dict(item.split("=", 1) for item in signature_header.split(",") if "=" in item)
    timestamp = parts.get("t")
    provided_signature = parts.get("s")
    if not timestamp or not provided_signature:
        return False

    # Recalcule la signature attendue puis compare de manière constante.
    signed_payload = f"{timestamp}.{raw_body.decode('utf-8')}".encode("utf-8")
    expected_signature = hmac.new(secret.encode("utf-8"), signed_payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected_signature, provided_signature)


def start_fedapay_transaction(payment):
    """Crée la transaction FedaPay et le lien de paiement pour un Payment déjà
    en base, et les enregistre dessus. Propage FedaPayError sans toucher au
    statut : l'appelant décide quoi faire du paiement en cas d'échec."""
    order = payment.order
    client = FedaPayClient()
    # Création de la transaction FedaPay pour la commande.
    transaction = client.create_transaction(
        amount_xof=payment.amount_xof,
        description=f"Commande ANIFOWOCHE #{order.pk}",
        callback_url=f"{settings.FRONTEND_BASE_URL}/commande/confirmation?order={order.pk}",
        customer_phone=order.phone,
        customer_email=order.email,
    )
    # Récupération de l'identifiant de transaction (structure de réponse variable).
    transaction_id = transaction.get("id") or transaction.get("v1/transaction", {}).get("id")
    payment.fedapay_transaction_id = str(transaction_id) if transaction_id else ""

    # Génération du lien de paiement si la transaction a été créée.
    token_data = client.generate_token(transaction_id) if transaction_id else {}
    payment.payment_url = token_data.get("url", "")
    payment.save(update_fields=["fedapay_transaction_id", "payment_url", "updated_at"])
    return payment


def apply_payment_status(payment, new_status, webhook_payload=None):
    """Applique un statut final issu de FedaPay au paiement local et déclenche
    les effets de bord associés : commande « préparée » + envoi de facture pour
    un paiement approuvé ; notification backoffice de relance pour un
    refus/annulation. Idempotent : si le statut est déjà appliqué, aucun effet
    de bord n'est rejoué (le webhook et le polling de confirmation peuvent se
    croiser). Retourne True si le statut a été changé."""
    if payment.status == new_status and webhook_payload is None:
        return False

    payment.status = new_status
    update_fields = ["status", "updated_at"]
    if webhook_payload is not None:
        payment.last_webhook_payload = webhook_payload
        update_fields.append("last_webhook_payload")
    payment.save(update_fields=update_fields)

    if new_status == Payment.Status.APPROVED:
        order = payment.order
        order.status = Order.Status.PREPARED
        order.save(update_fields=["status", "updated_at"])
        notify_invoice(payment)
    elif new_status in (Payment.Status.DECLINED, Payment.Status.CANCELED):
        # US-34 : l'échec remonte dans la cloche backoffice, d'où l'admin
        # peut ouvrir le paiement et le relancer.
        signal_payment_failure(payment)
    return True


RELAUNCHABLE_STATUSES = (Payment.Status.FAILED, Payment.Status.DECLINED, Payment.Status.CANCELED)


def relaunch_payment(payment):
    """Relance un paiement en ligne échoué (US-34, panier abandonné) : crée
    une nouvelle ligne Payment sur la même commande avec une nouvelle
    transaction FedaPay, puis envoie le nouveau lien de paiement au client.
    La ligne échouée est conservée telle quelle pour l'historique."""
    # Vérifications métier : seul FedaPay est relançable, et uniquement sur échec.
    if payment.provider != Payment.Provider.FEDAPAY:
        raise PaymentRelaunchError("Seuls les paiements en ligne (FedaPay) peuvent être relancés.")
    if payment.status not in RELAUNCHABLE_STATUSES:
        raise PaymentRelaunchError("Seuls les paiements échoués, refusés ou annulés peuvent être relancés.")

    order = payment.order
    # Interdiction de relancer si la commande est déjà payée.
    if order.payments.filter(status=Payment.Status.APPROVED).exists():
        raise PaymentRelaunchError(f"La commande #{order.pk} a déjà un paiement approuvé.")

    # Le moyen de paiement doit être toujours actif côté admin.
    payment_settings = PaymentSettings.get_solo()
    if not payment_settings.online_payment_enabled or not payment_settings.is_method_enabled(payment.method):
        raise PaymentRelaunchError("Ce moyen de paiement est actuellement désactivé (voir Réglages paiement).")

    # Nouvelle tentative de paiement sur la même commande.
    new_payment = Payment.objects.create(order=order, method=payment.method, amount_xof=order.total_xof)
    try:
        # Initie la nouvelle transaction FedaPay.
        start_fedapay_transaction(new_payment)
    except FedaPayError:
        # Échec d'initiation : la nouvelle ligne est marquée en échec et signalée au backoffice.
        new_payment.status = Payment.Status.FAILED
        new_payment.save(update_fields=["status", "updated_at"])
        signal_payment_failure(new_payment)
        raise
    # Envoi au client du nouveau lien de paiement.
    notify_payment_retry(new_payment)
    return new_payment


def signal_payment_failure(payment):
    """Rend l'échec visible côté backoffice (US-34) : cloche admin avec lien
    direct vers le paiement, d'où l'action « Relancer » est disponible."""
    return create_backoffice_notification(
        kind=BackofficeNotification.Kind.PAYMENT_FAILED,
        severity=BackofficeNotification.Severity.WARNING,
        title="Paiement échoué",
        message=(
            f"Paiement #{payment.pk} ({payment.get_method_display()}) de la commande "
            f"#{payment.order_id} : {payment.get_status_display().lower()}."
        ),
        action_url=f"/admin/payments/payment/{payment.pk}/change/",
        source="payments",
    )
