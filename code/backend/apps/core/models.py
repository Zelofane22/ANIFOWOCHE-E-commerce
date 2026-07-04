from django.conf import settings
from django.db import models


class SingletonModel(models.Model):
    """Base pour un modèle de réglages à une seule ligne (toujours pk=1)."""

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class StoreSettings(SingletonModel):
    """Réglages globaux de la boutique, modifiables par l'admin (Sprint 6)."""

    maintenance_mode = models.BooleanField(
        default=False,
        help_text="Si activé, plus aucune nouvelle commande ne peut être passée (boutique en pause).",
    )

    class Meta:
        verbose_name = "Réglages boutique"
        verbose_name_plural = "Réglages boutique"

    def __str__(self):
        return "Réglages boutique"


class SettingChangeRequest(models.Model):
    """Demande de changement pour un réglage sensible (Sprint 6) : chaque
    passage vers un état « à risque » (couper un moyen de paiement, couper le
    paiement en ligne, activer la maintenance) doit être justifié et validé
    par un superadmin — voir apps.core.services pour la logique d'application
    et le garde-fou anti-blocage total."""

    class SettingKey(models.TextChoices):
        MAINTENANCE_MODE = "maintenance_mode", "Mode maintenance boutique"
        ONLINE_PAYMENT_ENABLED = "online_payment_enabled", "Paiement en ligne (global)"
        PAYMENT_METHOD_MTN = "payment_method_mtn", "Paiement MTN Mobile Money"
        PAYMENT_METHOD_MOOV = "payment_method_moov", "Paiement Moov Money"
        PAYMENT_METHOD_CARD = "payment_method_card", "Paiement carte bancaire"

    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        APPROVED = "approved", "Approuvée"
        REJECTED = "rejected", "Refusée"

    setting_key = models.CharField(max_length=30, choices=SettingKey.choices)
    target_value = models.BooleanField(help_text="Valeur demandée : coché = activer, décoché = désactiver.")
    reason = models.TextField(help_text="Justification de la demande (obligatoire).")
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+"
    )
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    review_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Demande de changement de réglage"
        verbose_name_plural = "Demandes de changement de réglage"

    def __str__(self):
        return f"{self.get_setting_key_display()} → {self.target_value} ({self.get_status_display()})"
