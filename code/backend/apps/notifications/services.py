import logging

import requests
from django.conf import settings

from .models import Notification

logger = logging.getLogger(__name__)


class NotificationDeliveryError(Exception):
    pass


class WhatsAppClient:
    """Client minimal pour l'API WhatsApp Business Cloud (Meta).

    Utilise des identifiants placeholder tant que le vrai token et le
    phone_number_id ne sont pas fournis via les variables d'environnement.
    Voir https://developers.facebook.com/docs/whatsapp/cloud-api/.
    """

    def __init__(self):
        self.base_url = settings.WHATSAPP_API_BASE_URL.rstrip("/")
        self.phone_number_id = settings.WHATSAPP_PHONE_NUMBER_ID
        self.access_token = settings.WHATSAPP_ACCESS_TOKEN

    def send_text_message(self, *, to_phone, message):
        payload = {
            "messaging_product": "whatsapp",
            "to": to_phone.lstrip("+"),
            "type": "text",
            "text": {"body": message},
        }
        try:
            response = requests.post(
                f"{self.base_url}/{self.phone_number_id}/messages",
                json=payload,
                headers={"Authorization": f"Bearer {self.access_token}"},
                timeout=10,
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            raise NotificationDeliveryError(f"Échec d'envoi WhatsApp : {exc}") from exc
        data = response.json()
        return data.get("messages", [{}])[0].get("id", "")


def _send(*, event, recipient_phone, message):
    notification = Notification.objects.create(
        event=event,
        recipient_phone=recipient_phone,
        message=message,
    )
    client = WhatsAppClient()
    try:
        message_id = client.send_text_message(to_phone=recipient_phone, message=message)
        notification.status = Notification.Status.SENT
        notification.provider_message_id = message_id
    except NotificationDeliveryError as exc:
        logger.warning("Notification %s échouée pour %s : %s", event, recipient_phone, exc)
        notification.status = Notification.Status.FAILED
        notification.error_detail = str(exc)
    notification.save(update_fields=["status", "provider_message_id", "error_detail"])
    return notification


def notify_order_confirmation(order):
    items_summary = ", ".join(f"{item.quantity}x {item.product.name}" for item in order.items.all())
    message = (
        f"Bonjour {order.full_name}, votre commande ANIFOWOCHE #{order.pk} "
        f"({items_summary}) d'un montant de {order.total_xof} FCFA a bien été reçue."
    )
    return _send(event=Notification.Event.ORDER_CONFIRMATION, recipient_phone=order.phone, message=message)


def notify_delivery_in_transit(delivery):
    order = delivery.order
    message = (
        f"Bonjour {order.full_name}, votre commande ANIFOWOCHE #{order.pk} est en route "
        f"vers {delivery.zone.name} (créneau {delivery.slot.label})."
    )
    return _send(event=Notification.Event.DELIVERY_IN_TRANSIT, recipient_phone=order.phone, message=message)
