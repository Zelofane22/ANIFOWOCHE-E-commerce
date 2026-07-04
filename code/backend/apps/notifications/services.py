import logging

import requests
from django.conf import settings

from apps.users.models import Profile

from .models import Notification, NotificationSettings

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


class ResendClient:
    """Client minimal pour l'API Resend (emails transactionnels).

    Utilise une clé API et une adresse d'expédition placeholder tant que le
    domaine n'est pas vérifié et la vraie clé fournie via les variables
    d'environnement. Voir https://resend.com/docs/api-reference/emails/send-email.
    """

    def __init__(self):
        self.base_url = settings.RESEND_API_BASE_URL.rstrip("/")
        self.api_key = settings.RESEND_API_KEY
        self.from_email = settings.RESEND_FROM_EMAIL

    def send_email(self, *, to_email, subject, message):
        payload = {
            "from": self.from_email,
            "to": [to_email],
            "subject": subject,
            "html": f"<p>{message}</p>".replace("\n", "<br>"),
        }
        try:
            response = requests.post(
                f"{self.base_url}/emails",
                json=payload,
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=10,
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            raise NotificationDeliveryError(f"Échec d'envoi email Resend : {exc}") from exc
        return response.json().get("id", "")


def _resolve_channel(user):
    """Détermine le canal effectif compte tenu de la préférence du profil et
    des bascules admin (NotificationSettings, Sprint 6) : WhatsApp et SMS
    restent bloqués tant que l'admin ne les active pas dans son interface
    (vraies clés fournisseur requises), quelle que soit la préférence choisie
    par le client à l'inscription — repli sur l'email dans ce cas."""
    channel_settings = NotificationSettings.get_solo()
    profile = getattr(user, "profile", None) if user else None
    preferred = profile.notification_channel if profile else Profile.NotificationChannel.EMAIL

    if preferred == Profile.NotificationChannel.WHATSAPP and channel_settings.whatsapp_enabled:
        return Notification.Channel.WHATSAPP
    if preferred == Profile.NotificationChannel.SMS and channel_settings.sms_enabled:
        return Notification.Channel.SMS
    return Notification.Channel.EMAIL


def _send_whatsapp(*, event, recipient_phone, message):
    if not recipient_phone:
        return None
    notification = Notification.objects.create(
        channel=Notification.Channel.WHATSAPP,
        event=event,
        recipient_phone=recipient_phone,
        message=message,
    )
    try:
        message_id = WhatsAppClient().send_text_message(to_phone=recipient_phone, message=message)
        notification.status = Notification.Status.SENT
        notification.provider_message_id = message_id
    except NotificationDeliveryError as exc:
        logger.warning("Notification %s (whatsapp) échouée pour %s : %s", event, recipient_phone, exc)
        notification.status = Notification.Status.FAILED
        notification.error_detail = str(exc)
    notification.save(update_fields=["status", "provider_message_id", "error_detail"])
    return notification


def _send_email(*, event, recipient_email, subject, message):
    if not recipient_email:
        return None
    notification = Notification.objects.create(
        channel=Notification.Channel.EMAIL,
        event=event,
        recipient_email=recipient_email,
        message=message,
    )
    try:
        message_id = ResendClient().send_email(to_email=recipient_email, subject=subject, message=message)
        notification.status = Notification.Status.SENT
        notification.provider_message_id = message_id
    except NotificationDeliveryError as exc:
        logger.warning("Notification %s (email) échouée pour %s : %s", event, recipient_email, exc)
        notification.status = Notification.Status.FAILED
        notification.error_detail = str(exc)
    notification.save(update_fields=["status", "provider_message_id", "error_detail"])
    return notification


def _send_sms(*, event, recipient_phone, message):
    """Aucun fournisseur SMS n'est encore configuré (voir NotificationSettings,
    Sprint 6) : on trace la tentative pour l'admin plutôt que de la faire
    disparaître silencieusement, mais l'envoi échoue toujours tant qu'un vrai
    fournisseur n'est pas branché ici."""
    if not recipient_phone:
        return None
    notification = Notification.objects.create(
        channel=Notification.Channel.SMS,
        event=event,
        recipient_phone=recipient_phone,
        message=message,
    )
    error_detail = "Aucun fournisseur SMS configuré pour le moment."
    logger.warning("Notification %s (sms) non envoyée pour %s : %s", event, recipient_phone, error_detail)
    notification.status = Notification.Status.FAILED
    notification.error_detail = error_detail
    notification.save(update_fields=["status", "error_detail"])
    return notification


def _notify_for_order(*, event, order, message, subject):
    """Envoie sur le canal effectif du client propriétaire de la commande —
    email par défaut ; WhatsApp/SMS seulement si le client les préfère ET que
    l'admin les a activés (voir NotificationSettings, Sprint 6)."""
    channel = _resolve_channel(order.customer)
    if channel == Notification.Channel.WHATSAPP:
        return _send_whatsapp(event=event, recipient_phone=order.phone, message=message)
    if channel == Notification.Channel.SMS:
        return _send_sms(event=event, recipient_phone=order.phone, message=message)
    if order.email:
        return _send_email(event=event, recipient_email=order.email, subject=subject, message=message)
    return None


def notify_order_confirmation(order):
    items_summary = ", ".join(f"{item.quantity}x {item.product.name}" for item in order.items.all())
    message = (
        f"Bonjour {order.full_name}, votre commande ANIFOWOCHE #{order.pk} "
        f"({items_summary}) d'un montant de {order.total_xof} FCFA a bien été reçue."
    )
    return _notify_for_order(
        event=Notification.Event.ORDER_CONFIRMATION,
        order=order,
        message=message,
        subject=f"Commande ANIFOWOCHE #{order.pk} reçue",
    )


def notify_delivery_in_transit(delivery):
    order = delivery.order
    message = (
        f"Bonjour {order.full_name}, votre commande ANIFOWOCHE #{order.pk} est en route "
        f"vers {delivery.zone.name} (créneau {delivery.slot.label})."
    )
    return _notify_for_order(
        event=Notification.Event.DELIVERY_IN_TRANSIT,
        order=order,
        message=message,
        subject=f"Commande ANIFOWOCHE #{order.pk} en route",
    )


def notify_delivery_confirmed(delivery):
    order = delivery.order
    message = f"Bonjour {order.full_name}, votre commande ANIFOWOCHE #{order.pk} a bien été livrée. Merci pour votre confiance !"
    return _notify_for_order(
        event=Notification.Event.DELIVERY_CONFIRMED,
        order=order,
        message=message,
        subject=f"Commande ANIFOWOCHE #{order.pk} livrée",
    )


def notify_invoice(payment):
    order = payment.order
    items_summary = ", ".join(f"{item.quantity}x {item.product.name}" for item in order.items.all())
    message = (
        f"Bonjour {order.full_name}, voici la facture de votre commande ANIFOWOCHE #{order.pk} "
        f"({items_summary}). Montant payé : {payment.amount_xof} FCFA. Merci pour votre achat !"
    )
    return _notify_for_order(
        event=Notification.Event.INVOICE,
        order=order,
        message=message,
        subject=f"Facture — commande ANIFOWOCHE #{order.pk}",
    )


def notify_account_created(user):
    channel = _resolve_channel(user)
    message = f"Bienvenue sur ANIFOWOCHE, {user.first_name or user.username} ! Votre compte a bien été créé."
    profile = getattr(user, "profile", None)
    phone = profile.phone if profile else ""

    if channel == Notification.Channel.WHATSAPP:
        return _send_whatsapp(event=Notification.Event.ACCOUNT_CREATED, recipient_phone=phone, message=message)
    if channel == Notification.Channel.SMS:
        return _send_sms(event=Notification.Event.ACCOUNT_CREATED, recipient_phone=phone, message=message)
    if user.email:
        return _send_email(
            event=Notification.Event.ACCOUNT_CREATED,
            recipient_email=user.email,
            subject="Bienvenue sur ANIFOWOCHE",
            message=message,
        )
    return None
