from django.db import models


class Notification(models.Model):
    class Channel(models.TextChoices):
        WHATSAPP = "whatsapp", "WhatsApp"
        SMS = "sms", "SMS"

    class Event(models.TextChoices):
        ORDER_CONFIRMATION = "order_confirmation", "Confirmation de commande"
        DELIVERY_IN_TRANSIT = "delivery_in_transit", "Commande en route"

    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        SENT = "sent", "Envoyée"
        FAILED = "failed", "Échec"

    channel = models.CharField(max_length=10, choices=Channel.choices, default=Channel.WHATSAPP)
    event = models.CharField(max_length=30, choices=Event.choices)
    recipient_phone = models.CharField(max_length=20)
    message = models.TextField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    provider_message_id = models.CharField(max_length=100, blank=True)
    error_detail = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_event_display()} → {self.recipient_phone} ({self.status})"
