import logging

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.notifications.services import NotificationDeliveryError, ResendClient, _render_email_html, notify_account_created

from .models import Address
from .serializers import (
    AddressSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)


class AuthTokenObtainPairView(TokenObtainPairView):
    """Vue de connexion JWT avec limitation de débit contre le brute-force."""

    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        notify_account_created(user)
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=201,
        )


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.get_user()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/compte?reset_uid={uid}&reset_token={token}"
            message = (
                "Vous avez demandé la réinitialisation de votre mot de passe ANIFOWOCHE. "
                "Ce lien est temporaire."
            )
            html = _render_email_html(
                title="Réinitialiser votre mot de passe",
                message=message,
                cta_label="Choisir un nouveau mot de passe",
                cta_url=reset_url,
            )
            try:
                ResendClient().send_email(
                    to_email=user.email,
                    subject="Réinitialisation de votre mot de passe ANIFOWOCHE",
                    html=html,
                )
            except NotificationDeliveryError:
                logger.exception("Échec d'envoi du lien de réinitialisation pour l'utilisateur %s", user.pk)
        return Response(
            {"detail": "Si un compte actif correspond à cet email, un lien de réinitialisation a été envoyé."}
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Mot de passe mis à jour."}, status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class AddressViewSet(viewsets.ModelViewSet):
    """CRUD des adresses de livraison enregistrées du client connecté."""

    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
