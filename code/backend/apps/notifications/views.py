from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from django.contrib import admin
from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render

from .models import BackofficeNotification, NotificationSettings
from .serializers import NotificationSettingsSerializer


class NotificationSettingsView(APIView):
    """Lecture publique des canaux de notification activés par l'admin — le
    frontend s'en sert pour ne proposer que les canaux réellement fonctionnels
    à l'inscription (voir apps.users.models.Profile.NotificationChannel)."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(NotificationSettingsSerializer(NotificationSettings.get_solo()).data)


@staff_member_required
def backoffice_notifications_view(request):
    notifications = list(BackofficeNotification.objects.all())
    notification_ids = [notification.pk for notification in notifications]
    if notification_ids:
        BackofficeNotification.objects.filter(pk__in=notification_ids).delete()

    context = {
        **admin.site.each_context(request),
        "title": "Alertes backoffice",
        "notifications": notifications,
    }
    return render(request, "admin/backoffice_notifications.html", context)
