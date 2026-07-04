from django.db import models


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
