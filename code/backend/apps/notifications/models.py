from django.db import models


class NotificationSettings(models.Model):
    """Réglages globaux des canaux de notification, modifiables par l'admin
    (US Sprint 6) — singleton (une seule ligne, toujours pk=1).

    WhatsApp et SMS restent désactivés par défaut tant qu'aucune vraie clé
    fournisseur n'est configurée (WhatsApp Business API, fournisseur SMS) :
    voir apps.notifications.services._resolve_channel, qui retombe sur
    l'email si le canal préféré du client est désactivé ici."""

    whatsapp_enabled = models.BooleanField(
        default=False,
        help_text="Activer l'envoi réel de notifications WhatsApp (nécessite une vraie clé WhatsApp Business API).",
    )
    sms_enabled = models.BooleanField(
        default=False,
        help_text="Activer l'envoi réel de notifications SMS (nécessite un fournisseur SMS configuré).",
    )

    class Meta:
        verbose_name = "Réglages notifications"
        verbose_name_plural = "Réglages notifications"

    def __str__(self):
        return "Réglages notifications"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Notification(models.Model):
    class Channel(models.TextChoices):
        WHATSAPP = "whatsapp", "WhatsApp"
        EMAIL = "email", "Email"
        SMS = "sms", "SMS"

    class Event(models.TextChoices):
        ORDER_CONFIRMATION = "order_confirmation", "Confirmation de commande"
        DELIVERY_IN_TRANSIT = "delivery_in_transit", "Commande en route"
        DELIVERY_CONFIRMED = "delivery_confirmed", "Livraison confirmée"
        INVOICE = "invoice", "Facture"
        ACCOUNT_CREATED = "account_created", "Création de compte"
        SETTING_CHANGE_REQUESTED = "setting_change_requested", "Demande de changement de réglage"

    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        SENT = "sent", "Envoyée"
        FAILED = "failed", "Échec"

    channel = models.CharField(max_length=10, choices=Channel.choices, default=Channel.WHATSAPP)
    event = models.CharField(max_length=30, choices=Event.choices)
    recipient_phone = models.CharField(max_length=20, blank=True, default="")
    recipient_email = models.EmailField(blank=True, default="")
    message = models.TextField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    provider_message_id = models.CharField(max_length=100, blank=True)
    error_detail = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        recipient = self.recipient_email or self.recipient_phone
        return f"{self.get_event_display()} → {recipient} ({self.status})"


class BackofficeNotification(models.Model):
    """Alerte éphémère destinée aux administrateurs.

    Contrairement au journal d'envoi client (Notification), ces alertes ne sont
    conservées que tant qu'elles n'ont pas été lues dans le backoffice.
    """

    class Kind(models.TextChoices):
        APPROVAL_REQUIRED = "approval_required", "Validation requise"
        PROVIDER_ERROR = "provider_error", "Erreur fournisseur"
        CONFIGURATION = "configuration", "Problème de configuration"
        SYSTEM_ERROR = "system_error", "Erreur système"

    class Severity(models.TextChoices):
        INFO = "info", "Info"
        WARNING = "warning", "Attention"
        ERROR = "error", "Erreur"

    kind = models.CharField(max_length=30, choices=Kind.choices)
    severity = models.CharField(max_length=10, choices=Severity.choices, default=Severity.WARNING)
    title = models.CharField(max_length=160)
    message = models.TextField()
    action_url = models.CharField(max_length=255, blank=True, default="")
    source = models.CharField(max_length=80, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Alerte backoffice"
        verbose_name_plural = "Alertes backoffice"

    def __str__(self):
        return self.title
