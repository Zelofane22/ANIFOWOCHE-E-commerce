from rest_framework import serializers

from .models import NotificationSettings, SellerNotification


class NotificationSettingsSerializer(serializers.ModelSerializer):
    """Sérialise les canaux de notification activés (exposés publiquement au frontend)."""

    class Meta:
        model = NotificationSettings
        fields = ["whatsapp_enabled", "sms_enabled"]


class SellerNotificationSerializer(serializers.ModelSerializer):
    """Sérialise les notifications d'un vendeur (inbox)."""

    class Meta:
        model = SellerNotification
        fields = [
            "id",
            "notification_type",
            "title",
            "message",
            "is_read",
            "read_at",
            "action_url",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "read_at"]
