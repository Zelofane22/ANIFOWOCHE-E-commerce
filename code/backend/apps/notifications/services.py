import logging

import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.template.loader import render_to_string

from apps.users.models import Profile

from .models import BackofficeNotification, Notification, NotificationSettings

logger = logging.getLogger(__name__)
MAX_BACKOFFICE_NOTIFICATIONS = 50


class NotificationDeliveryError(Exception):
    """Erreur technique lors de l'envoi d'une notification par un fournisseur
    (WhatsApp/Resend) — distincte d'une erreur métier."""


def create_backoffice_notification(*, kind, severity, title, message, action_url="", source="notifications"):
    """Crée une alerte pour le backoffice et la limite au maximum autorisé."""
    # Insertion de la nouvelle alerte backoffice.
    notification = BackofficeNotification.objects.create(
        kind=kind,
        severity=severity,
        title=title,
        message=message,
        action_url=action_url,
        source=source,
    )

    # Nettoyage des alertes les plus anciennes au-delà du plafond MAX_BACKOFFICE_NOTIFICATIONS.
    overflow_ids = list(
        BackofficeNotification.objects.order_by("-created_at").values_list("id", flat=True)[
            MAX_BACKOFFICE_NOTIFICATIONS:
        ]
    )
    if overflow_ids:
        BackofficeNotification.objects.filter(id__in=overflow_ids).delete()
    return notification


class WhatsAppClient:
    """Client minimal pour l'API WhatsApp Business Cloud (Meta).

    Utilise des identifiants placeholder tant que le vrai token et le
    phone_number_id ne sont pas fournis via les variables d'environnement.
    Voir https://developers.facebook.com/docs/whatsapp/cloud-api/.
    """

    def __init__(self):
        # Chargement de la configuration WhatsApp depuis les variables d'environnement.
        self.base_url = settings.WHATSAPP_API_BASE_URL.rstrip("/")
        self.phone_number_id = settings.WHATSAPP_PHONE_NUMBER_ID
        self.access_token = settings.WHATSAPP_ACCESS_TOKEN

    def send_text_message(self, *, to_phone, message):
        # Construction du corps de la requête WhatsApp Cloud API (message texte simple).
        payload = {
            "messaging_product": "whatsapp",
            "to": to_phone.lstrip("+"),
            "type": "text",
            "text": {"body": message},
        }
        try:
            # Envoi effectif du message via l'API Meta.
            response = requests.post(
                f"{self.base_url}/{self.phone_number_id}/messages",
                json=payload,
                headers={"Authorization": f"Bearer {self.access_token}"},
                timeout=10,
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            raise NotificationDeliveryError(f"Échec d'envoi WhatsApp : {exc}") from exc
        # Extraction de l'identifiant du message renvoyé par le fournisseur.
        data = response.json()
        return data.get("messages", [{}])[0].get("id", "")


class ResendClient:
    """Client minimal pour l'API Resend (emails transactionnels).

    Utilise une clé API et une adresse d'expédition placeholder tant que le
    domaine n'est pas vérifié et la vraie clé fournie via les variables
    d'environnement. Voir https://resend.com/docs/api-reference/emails/send-email.
    """

    def __init__(self):
        # Chargement de la configuration Resend (clé API et expéditeur) depuis l'environnement.
        self.base_url = settings.RESEND_API_BASE_URL.rstrip("/")
        self.api_key = settings.RESEND_API_KEY
        self.from_email = settings.RESEND_FROM_EMAIL

    def send_email(self, *, to_email, subject, html):
        # Construction de la requête d'envoi d'email transactionnel via l'API Resend.
        payload = {
            "from": self.from_email,
            "to": [to_email],
            "subject": subject,
            "html": html,
        }
        try:
            # Envoi effectif de l'email.
            response = requests.post(
                f"{self.base_url}/emails",
                json=payload,
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=10,
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            raise NotificationDeliveryError(f"Échec d'envoi email Resend : {exc}") from exc
        # Extraction de l'identifiant du message renvoyé par Resend.
        return response.json().get("id", "")


def _render_email_html(*, title, message, cta_label="", cta_url=""):
    """Rend le gabarit HTML commun des emails (en-tête, message, bouton CTA)."""
    return render_to_string(
        "emails/base_email.html",
        {
            "title": title,
            "message": message,
            "preheader": message,
            "cta_label": cta_label,
            "cta_url": cta_url,
            "logo_url": f"{settings.FRONTEND_BASE_URL}/anifowoche-logo.png",
        },
    )


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
    """Envoie un message WhatsApp et trace le résultat dans la table Notification."""
    if not recipient_phone:
        return None
    # Création de la trace de notification (statut En attente par défaut).
    notification = Notification.objects.create(
        channel=Notification.Channel.WHATSAPP,
        event=event,
        recipient_phone=recipient_phone,
        message=message,
    )
    try:
        # Envoi via le fournisseur et mise à jour du statut en cas de succès.
        message_id = WhatsAppClient().send_text_message(to_phone=recipient_phone, message=message)
        notification.status = Notification.Status.SENT
        notification.provider_message_id = message_id
    except NotificationDeliveryError as exc:
        # Échec d'envoi : on marque la notification en échec et on alerte le backoffice.
        logger.warning("Notification %s (whatsapp) échouée pour %s : %s", event, recipient_phone, exc)
        notification.status = Notification.Status.FAILED
        notification.error_detail = str(exc)
        create_backoffice_notification(
            kind=BackofficeNotification.Kind.PROVIDER_ERROR,
            severity=BackofficeNotification.Severity.ERROR,
            title="Échec d'envoi WhatsApp",
            message=f"{notification.get_event_display()} vers {recipient_phone} : {exc}",
            action_url="/admin/notifications/notification/",
        )
    notification.save(update_fields=["status", "provider_message_id", "error_detail"])
    return notification


def _send_email(*, event, recipient_email, subject, message, title, cta_label="", cta_url=""):
    """Envoie un email transactionnel (HTML) et trace le résultat dans la table Notification."""
    if not recipient_email:
        return None
    # Création de la trace de notification email.
    notification = Notification.objects.create(
        channel=Notification.Channel.EMAIL,
        event=event,
        recipient_email=recipient_email,
        message=message,
    )
    try:
        # Rendu du HTML puis envoi via Resend ; succès → statut Envoyée.
        html = _render_email_html(title=title, message=message, cta_label=cta_label, cta_url=cta_url)
        message_id = ResendClient().send_email(to_email=recipient_email, subject=subject, html=html)
        notification.status = Notification.Status.SENT
        notification.provider_message_id = message_id
    except NotificationDeliveryError as exc:
        # Échec d'envoi : on marque la notification en échec et on alerte le backoffice.
        logger.warning("Notification %s (email) échouée pour %s : %s", event, recipient_email, exc)
        notification.status = Notification.Status.FAILED
        notification.error_detail = str(exc)
        create_backoffice_notification(
            kind=BackofficeNotification.Kind.PROVIDER_ERROR,
            severity=BackofficeNotification.Severity.ERROR,
            title="Échec d'envoi email",
            message=f"{notification.get_event_display()} vers {recipient_email} : {exc}",
            action_url="/admin/notifications/notification/",
        )
    notification.save(update_fields=["status", "provider_message_id", "error_detail"])
    return notification


def _send_sms(*, event, recipient_phone, message):
    """Aucun fournisseur SMS n'est encore configuré (voir NotificationSettings,
    Sprint 6) : on trace la tentative pour l'admin plutôt que de la faire
    disparaître silencieusement, mais l'envoi échoue toujours tant qu'un vrai
    fournisseur n'est pas branché ici."""
    if not recipient_phone:
        return None
    # Création de la trace de notification SMS (l'envoi réel est toujours impossible pour l'instant).
    notification = Notification.objects.create(
        channel=Notification.Channel.SMS,
        event=event,
        recipient_phone=recipient_phone,
        message=message,
    )
    # Marque la tentative comme échouée faute de fournisseur SMS configuré.
    error_detail = "Aucun fournisseur SMS configuré pour le moment."
    logger.warning("Notification %s (sms) non envoyée pour %s : %s", event, recipient_phone, error_detail)
    notification.status = Notification.Status.FAILED
    notification.error_detail = error_detail
    notification.save(update_fields=["status", "error_detail"])
    # Alerte le backoffice pour l'informer du fournisseur manquant.
    create_backoffice_notification(
        kind=BackofficeNotification.Kind.CONFIGURATION,
        severity=BackofficeNotification.Severity.WARNING,
        title="Fournisseur SMS manquant",
        message=f"{notification.get_event_display()} vers {recipient_phone} : {error_detail}",
        action_url="/admin/reglages/",
    )
    return notification


def _notify_for_order(*, event, order, message, subject, title, cta_label="", cta_url=""):
    """Envoie sur le canal effectif du client propriétaire de la commande,
    avec un rendu HTML pour les emails lorsqu'un email est utilisé."""
    # Résolution du canal effectif (préférence client ∩ activations admin).
    channel = _resolve_channel(order.customer)
    if channel == Notification.Channel.WHATSAPP:
        return _send_whatsapp(event=event, recipient_phone=order.phone, message=message)
    if channel == Notification.Channel.SMS:
        return _send_sms(event=event, recipient_phone=order.phone, message=message)
    # Repli sur l'email (nécessite une adresse sur la commande).
    if order.email:
        return _send_email(
            event=event,
            recipient_email=order.email,
            subject=subject,
            message=message,
            title=title,
            cta_label=cta_label,
            cta_url=cta_url,
        )
    return None


def notify_order_cancellation(order, reason=""):
    """Prévient le client que sa commande a été annulée (motif optionnel inclus)."""
    # Composition du message, avec le motif d'annulation s'il est fourni.
    message = (
        f"Bonjour {order.full_name}, votre commande ANIFOWOCHE #{order.pk} "
        f"a été annulée."
    )
    if reason:
        message += f" Motif : {reason}"
    return _notify_for_order(
        event=Notification.Event.ORDER_CANCELLED,
        order=order,
        message=message,
        subject=f"Commande ANIFOWOCHE #{order.pk} annulée",
        title="Commande annulée",
        cta_label="Voir mes commandes",
        cta_url=f"{settings.FRONTEND_BASE_URL}/compte",
    )


def notify_order_confirmation(order):
    """Confirme au client la bonne réception de sa commande avec le détail des articles."""
    # Résumé des articles de la commande pour le corps du message.
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
        title="Commande confirmée",
        cta_label="Suivre ma commande",
        cta_url=f"{settings.FRONTEND_BASE_URL}/compte",
    )


def notify_seller_new_order(order):
    """Envoie une notification email à chaque vendeur concerné par une nouvelle commande,
    ne listant que les produits de ce vendeur."""
    sellers_items = {}
    for item in order.items.select_related("product__seller__user").all():
        seller = item.product.seller
        if seller is None:
            continue
        sellers_items.setdefault(seller, []).append(item)

    sent = []
    for seller, items in sellers_items.items():
        seller_user = seller.user
        if not seller_user.email:
            continue

        items_summary = ", ".join(f"{item.quantity}x {item.product.name}" for item in items)
        seller_total = sum(item.subtotal_xof for item in items)
        message = (
            f"Bonjour {seller.display_name}, vous avez reçu une nouvelle commande "
            f"ANIFOWOCHE #{order.pk} de la part de {order.full_name}.\n\n"
            f"Articles : {items_summary}\n"
            f"Montant pour votre boutique : {seller_total} FCFA\n"
            f"Adresse de livraison : {order.address}, {order.city}"
        )
        notification = _send_email(
            event=Notification.Event.ORDER_CONFIRMATION,
            recipient_email=seller_user.email,
            subject=f"Nouvelle commande ANIFOWOCHE #{order.pk} reçue",
            message=message,
            title="Nouvelle commande reçue",
            cta_label="Voir la commande",
            cta_url=f"{settings.FRONTEND_BASE_URL}/admin/orders/order/{order.pk}/change/",
        )
        if notification:
            sent.append(notification)
    return sent


def notify_delivery_in_transit(delivery):
    """Prévient le client que sa commande est en cours de livraison (zone + créneau)."""
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
        title="Votre commande est en route",
        cta_label="Suivre ma commande",
        cta_url=f"{settings.FRONTEND_BASE_URL}/compte",
    )


def notify_delivery_confirmed(delivery):
    """Prévient le client que sa commande a bien été livrée."""
    order = delivery.order
    message = f"Bonjour {order.full_name}, votre commande ANIFOWOCHE #{order.pk} a bien été livrée. Merci pour votre confiance !"
    return _notify_for_order(
        event=Notification.Event.DELIVERY_CONFIRMED,
        order=order,
        message=message,
        subject=f"Commande ANIFOWOCHE #{order.pk} livrée",
        title="Commande livrée",
        cta_label="Voir mon compte",
        cta_url=f"{settings.FRONTEND_BASE_URL}/compte",
    )


def notify_payment_retry(payment):
    """Envoie au client le nouveau lien de paiement après relance par l'admin
    (US-34). Le lien figure aussi dans le corps du message pour les canaux
    sans bouton (WhatsApp/SMS)."""
    order = payment.order
    message = (
        f"Bonjour {order.full_name}, le paiement de votre commande ANIFOWOCHE #{order.pk} "
        f"({payment.amount_xof} FCFA) n'a pas abouti. Vous pouvez le reprendre ici : {payment.payment_url}"
    )
    return _notify_for_order(
        event=Notification.Event.PAYMENT_RETRY,
        order=order,
        message=message,
        subject=f"Reprenez le paiement de votre commande ANIFOWOCHE #{order.pk}",
        title="Votre paiement n'a pas abouti",
        cta_label="Payer ma commande",
        cta_url=payment.payment_url,
    )


def notify_subscription_expiring(subscription, days_left):
    """Prévient le vendeur que son abonnement expire bientôt (rappel 1j/2
    durant la semaine précédant `ends_at`), avec un lien pour payer en avance."""
    seller = subscription.seller
    seller_user = seller.user
    if not seller_user.email:
        return None
    plan_label = subscription.get_plan_display()
    message = (
        f"Bonjour {seller.display_name}, votre abonnement ANIF Seller {plan_label} "
        f"expire dans {days_left} jour(s) (le {subscription.ends_at.strftime('%d/%m/%Y')}). "
        f"Renouvelez dès maintenant pour éviter toute coupure de votre boutique."
    )
    return _send_email(
        event=Notification.Event.SUBSCRIPTION_EXPIRING,
        recipient_email=seller_user.email,
        subject=f"Votre abonnement {plan_label} expire dans {days_left} jour(s)",
        message=message,
        title="Votre abonnement expire bientôt",
        cta_label="Renouveler mon abonnement",
        cta_url=f"{settings.SELLER_FRONTEND_BASE_URL.rstrip('/')}/plan",
    )


def notify_invoice(payment):
    """Envoie la facture du paiement au client, avec le détail des articles."""
    order = payment.order
    # Résumé des articles de la commande pour la facture.
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
        title="Votre facture ANIFOWOCHE",
        cta_label="Voir mon compte",
        cta_url=f"{settings.FRONTEND_BASE_URL}/compte",
    )


def resend_notification(notification):
    """Retente l'envoi d'une notification existante (même message, même destinataire)."""
    # Ré-envoi par email : nouveau rendu HTML puis envoi via Resend.
    if notification.channel == Notification.Channel.EMAIL:
        try:
            html = _render_email_html(title=notification.get_event_display(), message=notification.message)
            message_id = ResendClient().send_email(
                to_email=notification.recipient_email,
                subject=f"ANIFOWOCHE — {notification.get_event_display()}",
                html=html,
            )
        except NotificationDeliveryError as exc:
            notification.status = Notification.Status.FAILED
            notification.error_detail = str(exc)
        else:
            notification.status = Notification.Status.SENT
            notification.provider_message_id = message_id
            notification.error_detail = ""
    # Ré-envoi par WhatsApp.
    elif notification.channel == Notification.Channel.WHATSAPP:
        try:
            message_id = WhatsAppClient().send_text_message(
                to_phone=notification.recipient_phone, message=notification.message
            )
        except NotificationDeliveryError as exc:
            notification.status = Notification.Status.FAILED
            notification.error_detail = str(exc)
        else:
            notification.status = Notification.Status.SENT
            notification.provider_message_id = message_id
            notification.error_detail = ""
    else:
        # Canal non géré pour le renvoi (ex. SMS sans fournisseur).
        raise NotificationDeliveryError(f"Canal non pris en charge pour le renvoi : {notification.channel}")
    notification.save(update_fields=["status", "provider_message_id", "error_detail"])
    return notification


def notify_account_created(user):
    """Souhaite la bienvenue au nouveau compte, sur le canal effectif du profil."""
    # Résolution du canal de notification préféré/effectif.
    channel = _resolve_channel(user)
    message = f"Bienvenue sur ANIFOWOCHE, {user.first_name or user.username} ! Votre compte a bien été créé."
    profile = getattr(user, "profile", None)
    phone = profile.phone if profile else ""

    if channel == Notification.Channel.WHATSAPP:
        return _send_whatsapp(event=Notification.Event.ACCOUNT_CREATED, recipient_phone=phone, message=message)
    if channel == Notification.Channel.SMS:
        return _send_sms(event=Notification.Event.ACCOUNT_CREATED, recipient_phone=phone, message=message)
    # Repli sur l'email (nécessite une adresse sur le compte).
    if user.email:
        return _send_email(
            event=Notification.Event.ACCOUNT_CREATED,
            recipient_email=user.email,
            subject="Bienvenue sur ANIFOWOCHE",
            message=message,
            title=f"Bienvenue, {user.first_name or user.username} !",
            cta_label="Découvrir la boutique",
            cta_url=settings.FRONTEND_BASE_URL,
        )
    return None


def notify_setting_change_requested(change_request):
    """Alerte tous les superadmins actifs qu'une demande de changement de
    réglage sensible (Sprint 6 : paiement en ligne, moyens de paiement,
    maintenance) attend leur validation — voir apps.core.services."""
    User = get_user_model()
    action = "Activer" if change_request.target_value else "Désactiver"
    # Composition du message détaillant la demande de changement de réglage.
    message = (
        f"Nouvelle demande de changement de réglage sensible.\n\n"
        f"Réglage : {change_request.get_setting_key_display()}\n"
        f"Action demandée : {action}\n"
        f"Demandée par : {change_request.requested_by}\n"
        f"Justification : {change_request.reason}\n\n"
        f"À valider dans l'admin : /admin/core/settingchangerequest/{change_request.pk}/change/"
    )
    # Création de l'alerte backoffice demandant la validation.
    create_backoffice_notification(
        kind=BackofficeNotification.Kind.APPROVAL_REQUIRED,
        severity=BackofficeNotification.Severity.WARNING,
        title="Validation de réglage requise",
        message=(
            f"{change_request.get_setting_key_display()} : "
            f"{action.lower()} demandé par {change_request.requested_by}."
        ),
        action_url=f"/admin/core/settingchangerequest/{change_request.pk}/change/",
    )
    # Envoi d'un email à chaque superadmin actif, puis collecte des envois réussis.
    sent = []
    for superuser in User.objects.filter(is_superuser=True, is_active=True).exclude(email=""):
        notification = _send_email(
            event=Notification.Event.SETTING_CHANGE_REQUESTED,
            recipient_email=superuser.email,
            subject=f"[ANIFOWOCHE] Validation requise — {change_request.get_setting_key_display()}",
            message=message,
            title="Validation de réglage requise",
        )
        if notification:
            sent.append(notification)
    return sent
