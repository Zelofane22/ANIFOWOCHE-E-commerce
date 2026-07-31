from rest_framework import serializers

from .models import NotificationSettings


class NotificationSettingsSerializer(serializers.ModelSerializer):
    """Sérialise les canaux de notification activés (exposés publiquement au frontend)."""

    class Meta:
        model = NotificationSettings
        fields = ["whatsapp_enabled", "sms_enabled"]
