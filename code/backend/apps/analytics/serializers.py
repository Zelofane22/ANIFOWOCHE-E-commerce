from rest_framework import serializers

from .models import PageView


class PageViewSerializer(serializers.ModelSerializer):
    """Sérialise une vue de page envoyée par le tracking frontend."""
    class Meta:
        model = PageView
        fields = ["path", "referrer", "session_key"]
