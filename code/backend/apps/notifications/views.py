from django.contrib import admin
from django.contrib.admin.views.decorators import staff_member_required
from django.http import HttpResponseNotAllowed
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils import timezone

from rest_framework import permissions, status
from rest_framework.generics import ListAPIView, UpdateAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BackofficeNotification, NotificationSettings, SellerNotification
from .serializers import NotificationSettingsSerializer, SellerNotificationSerializer


class NotificationSettingsView(APIView):
    """Lecture publique des canaux de notification activés par l'admin — le
    frontend s'en sert pour ne proposer que les canaux réellement fonctionnels
    à l'inscription (voir apps.users.models.Profile.NotificationChannel)."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Sert les canaux activés par l'admin au frontend (choix à l'inscription).
        return Response(NotificationSettingsSerializer(NotificationSettings.get_solo()).data)


class SellerNotificationListView(ListAPIView):
    """Liste les notifications du vendeur authentifié (inbox)."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SellerNotificationSerializer

    def get_queryset(self):
        seller = self.request.user.seller_profile
        return SellerNotification.objects.filter(seller=seller)


class SellerNotificationMarkReadView(UpdateAPIView):
    """Marque une notification du vendeur comme lue."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SellerNotificationSerializer

    def get_queryset(self):
        seller = self.request.user.seller_profile
        return SellerNotification.objects.filter(seller=seller)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance.is_read:
            instance.is_read = True
            instance.read_at = timezone.now()
            instance.save(update_fields=["is_read", "read_at"])
        return Response(SellerNotificationSerializer(instance).data)


class SellerNotificationMarkAllReadView(APIView):
    """Marque toutes les notifications non lues du vendeur comme lues."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        seller = request.user.seller_profile
        updated = SellerNotification.objects.filter(seller=seller, is_read=False).update(
            is_read=True, read_at=timezone.now()
        )
        return Response({"marked": updated})


@staff_member_required
def backoffice_notifications_view(request):
    # Par défaut, n'affiche que les alertes non lues ; `?filter=all` inclut
    # l'historique des alertes déjà lues (avec leur date de lecture).
    notifications = BackofficeNotification.objects.all()
    if request.GET.get("filter") != "all":
        notifications = notifications.filter(is_read=False)

    context = {
        **admin.site.each_context(request),
        "title": "Alertes backoffice",
        "notifications": notifications,
        "filter": request.GET.get("filter", "unread"),
        "unread_count": BackofficeNotification.objects.filter(is_read=False).count(),
    }
    return render(request, "admin/backoffice_notifications.html", context)


@staff_member_required
def mark_notification_read(request, pk):
    # Marque une alerte comme lue : uniquement en POST, jamais déclenché par un
    # simple affichage de la liste (un GET est rejeté en 405).
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    BackofficeNotification.objects.filter(pk=pk).update(is_read=True, read_at=timezone.now())
    return redirect(reverse("admin_backoffice_notifications"))


@staff_member_required
def mark_all_notifications_read(request):
    # Marque toutes les alertes non lues comme lues : uniquement en POST.
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    BackofficeNotification.objects.filter(is_read=False).update(is_read=True, read_at=timezone.now())
    return redirect(reverse("admin_backoffice_notifications"))
