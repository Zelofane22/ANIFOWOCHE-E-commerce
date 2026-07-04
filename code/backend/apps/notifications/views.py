from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import NotificationSettings
from .serializers import NotificationSettingsSerializer


class NotificationSettingsView(APIView):
    """Lecture publique des canaux de notification activés par l'admin — le
    frontend s'en sert pour ne proposer que les canaux réellement fonctionnels
    à l'inscription (voir apps.users.models.Profile.NotificationChannel)."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(NotificationSettingsSerializer(NotificationSettings.get_solo()).data)
