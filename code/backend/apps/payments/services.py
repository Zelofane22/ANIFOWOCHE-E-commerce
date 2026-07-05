import hashlib
import hmac

import requests
from django.conf import settings

from apps.notifications.models import BackofficeNotification
from apps.notifications.services import create_backoffice_notification, notify_payment_retry

from .models import Payment, PaymentSettings


class FedaPayError(Exception):
    pass


class PaymentRelaunchError(Exception):
    """Relance impossible pour une raison métier (statut, moyen de paiement,
    commande déjà payée…) — distincte d'un échec technique FedaPay."""


class FedaPayClient:
    """Client minimal pour l'API FedaPay (sandbox MTN/Moov + carte).

    Utilise des clés placeholder tant que les vraies clés sandbox ne sont
    pas fournies dans les variables d'environnement (FEDAPAY_SECRET_KEY).
    Voir https://docs.fedapay.com/.
    """

    def __init__(self):
        self.base_url = settings.FEDAPAY_BASE_URL.rstrip("/")
        self.api_key = settings.FEDAPAY_SECRET_KEY

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def create_transaction(self, *, amount_xof, description, callback_url, customer_phone, customer_email=""):
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
        try:
            response = requests.post(
                f"{self.base_url}/v1/transactions",
                json=payload,
                headers=self._headers(),
                timeout=10,
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            raise FedaPayError(f"Échec de création de la transaction FedaPay : {exc}") from exc
        return response.json()

    def generate_token(self, transaction_id):
        try:
            response = requests.post(
                f"{self.base_url}/v1/transactions/{transaction_id}/token",
                headers=self._headers(),
                timeout=10,
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            raise FedaPayError(f"Échec de génération du lien de paiement FedaPay : {exc}") from exc
        return response.json()


def verify_webhook_signature(raw_body: bytes, signature_header: str, secret: str) -> bool:
    """Vérifie la signature d'un webhook FedaPay.

    FedaPay envoie un en-tête `X-FEDAPAY-SIGNATURE` au format
    "t=<timestamp>,s=<signature>" où signature = HMAC-SHA256(secret, "<timestamp>.<body>").
    """
    if not signature_header:
        return False

    parts = dict(item.split("=", 1) for item in signature_header.split(",") if "=" in item)
    timestamp = parts.get("t")
    provided_signature = parts.get("s")
    if not timestamp or not provided_signature:
        return False

    signed_payload = f"{timestamp}.{raw_body.decode('utf-8')}".encode("utf-8")
    expected_signature = hmac.new(secret.encode("utf-8"), signed_payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected_signature, provided_signature)


def start_fedapay_transaction(payment):
    """Crée la transaction FedaPay et le lien de paiement pour un Payment déjà
    en base, et les enregistre dessus. Propage FedaPayError sans toucher au
    statut : l'appelant décide quoi faire du paiement en cas d'échec."""
    order = payment.order
    client = FedaPayClient()
    transaction = client.create_transaction(
        amount_xof=payment.amount_xof,
        description=f"Commande ANIFOWOCHE #{order.pk}",
        callback_url=f"{settings.FRONTEND_BASE_URL}/commande/confirmation?order={order.pk}",
        customer_phone=order.phone,
        customer_email=order.email,
    )
    transaction_id = transaction.get("id") or transaction.get("v1/transaction", {}).get("id")
    payment.fedapay_transaction_id = str(transaction_id) if transaction_id else ""

    token_data = client.generate_token(transaction_id) if transaction_id else {}
    payment.payment_url = token_data.get("url", "")
    payment.save(update_fields=["fedapay_transaction_id", "payment_url", "updated_at"])
    return payment


RELAUNCHABLE_STATUSES = (Payment.Status.FAILED, Payment.Status.DECLINED, Payment.Status.CANCELED)


def relaunch_payment(payment):
    """Relance un paiement en ligne échoué (US-34, panier abandonné) : crée
    une nouvelle ligne Payment sur la même commande avec une nouvelle
    transaction FedaPay, puis envoie le nouveau lien de paiement au client.
    La ligne échouée est conservée telle quelle pour l'historique."""
    if payment.provider != Payment.Provider.FEDAPAY:
        raise PaymentRelaunchError("Seuls les paiements en ligne (FedaPay) peuvent être relancés.")
    if payment.status not in RELAUNCHABLE_STATUSES:
        raise PaymentRelaunchError("Seuls les paiements échoués, refusés ou annulés peuvent être relancés.")

    order = payment.order
    if order.payments.filter(status=Payment.Status.APPROVED).exists():
        raise PaymentRelaunchError(f"La commande #{order.pk} a déjà un paiement approuvé.")

    payment_settings = PaymentSettings.get_solo()
    if not payment_settings.online_payment_enabled or not payment_settings.is_method_enabled(payment.method):
        raise PaymentRelaunchError("Ce moyen de paiement est actuellement désactivé (voir Réglages paiement).")

    new_payment = Payment.objects.create(order=order, method=payment.method, amount_xof=order.total_xof)
    try:
        start_fedapay_transaction(new_payment)
    except FedaPayError:
        new_payment.status = Payment.Status.FAILED
        new_payment.save(update_fields=["status", "updated_at"])
        signal_payment_failure(new_payment)
        raise
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
