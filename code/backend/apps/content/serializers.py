from rest_framework import serializers

from .models import Banner


class BannerSerializer(serializers.ModelSerializer):
    """Sérialise une bannière publiée de la page d'accueil."""
    class Meta:
        model = Banner
        fields = ["id", "title", "subtitle", "image", "link_url", "order"]
