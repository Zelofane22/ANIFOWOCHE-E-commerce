from django.conf import settings
from django.contrib.auth.models import User, UserManager
from django.db import models

from apps.delivery.models import DeliveryZone


class ClientManager(UserManager):
    def get_queryset(self):
        return super().get_queryset().filter(is_staff=False)


class Client(User):
    """Proxy sur auth.User : les comptes clients (is_staff=False).

    Même table en base que les administrateurs — seule la présentation
    dans l'admin est séparée, l'auth JWT et les FK restent sur auth.User.
    """

    objects = ClientManager()

    class Meta:
        proxy = True
        verbose_name = "client"
        verbose_name_plural = "clients"


class AdminUserManager(UserManager):
    def get_queryset(self):
        return super().get_queryset().filter(is_staff=True)


class AdminUser(User):
    """Proxy sur auth.User : les comptes administrateurs (is_staff=True).

    Superadmin = is_superuser=True (100 % des droits) ; staff = agent dont
    les droits sont limités aux permissions/groupes accordés par un superadmin.
    """

    objects = AdminUserManager()

    class Meta:
        proxy = True
        verbose_name = "administrateur"
        verbose_name_plural = "administrateurs"


class Address(models.Model):
    """Adresse de livraison enregistrée par un client (US-18)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="addresses"
    )
    label = models.CharField(max_length=100, blank=True, help_text="Ex. Maison, Bureau")
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20)
    zone = models.ForeignKey(DeliveryZone, on_delete=models.PROTECT, related_name="addresses")
    notes = models.CharField(max_length=255, blank=True, help_text="Indications complémentaires")
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_default", "-created_at"]

    def __str__(self):
        return f"{self.label or self.zone.name} — {self.full_name}"


class Profile(models.Model):
    """Préférences de notification du client, choisies à l'inscription."""

    class NotificationChannel(models.TextChoices):
        WHATSAPP = "whatsapp", "WhatsApp"
        EMAIL = "email", "Email"
        SMS = "sms", "SMS"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    phone = models.CharField(max_length=20, blank=True, help_text="Requis pour recevoir les notifications WhatsApp/SMS")
    notification_channel = models.CharField(
        max_length=10, choices=NotificationChannel.choices, default=NotificationChannel.EMAIL
    )

    def __str__(self):
        return f"Profil de {self.user}"
