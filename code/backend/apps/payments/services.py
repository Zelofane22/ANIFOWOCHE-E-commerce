import hashlib
import hmac

import requests
from django.conf import settings


class FedaPayError(Exception):
    pass


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
