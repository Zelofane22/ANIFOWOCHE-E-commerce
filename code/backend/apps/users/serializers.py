from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers

from apps.delivery.models import DeliveryZone

from .backends import normalize_phone
from .models import Address, Profile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Sérialise un utilisateur avec son canal de notification et son téléphone (issus du profil)."""
    notification_channel = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_staff", "notification_channel", "phone"]

    def get_notification_channel(self, user):
        # Canal de notification préféré du profil (email par défaut si absent).
        profile = getattr(user, "profile", None)
        return profile.notification_channel if profile else Profile.NotificationChannel.EMAIL

    def get_phone(self, user):
        # Numéro de téléphone enregistré sur le profil.
        profile = getattr(user, "profile", None)
        return profile.phone if profile else ""


class RegisterSerializer(serializers.ModelSerializer):
    """Inscription d'un client : compte + profil (téléphone et canal de notification)."""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True, default="", max_length=20)
    notification_channel = serializers.ChoiceField(
        choices=Profile.NotificationChannel.choices,
        required=False,
        default=Profile.NotificationChannel.EMAIL,
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "password2",
            "first_name",
            "last_name",
            "phone",
            "notification_channel",
        ]

    def validate_email(self, value):
        # Unicité de l'adresse email si fournie.
        if value and User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un compte existe déjà avec cet email.")
        return value

    def validate_phone(self, value):
        # Normalise le numéro de téléphone au format international.
        return normalize_phone(value) if value else value

    def validate(self, attrs):
        # Contrôle que les deux mots de passe correspondent.
        password2 = attrs.pop("password2")
        if attrs["password"] != password2:
            raise serializers.ValidationError({"password2": "Les mots de passe ne correspondent pas."})
        return attrs

    def create(self, validated_data):
        # Extraction des données de profil hors du bloc utilisateur.
        phone = validated_data.pop("phone", "")
        notification_channel = validated_data.pop("notification_channel", Profile.NotificationChannel.EMAIL)
        # Création atomique du compte et de son profil.
        with transaction.atomic():
            user = User.objects.create_user(**validated_data)
            Profile.objects.create(user=user, phone=phone, notification_channel=notification_channel)
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    """Valide la demande de réinitialisation de mot de passe (email uniquement)."""
    email = serializers.EmailField()

    def get_user(self):
        # Retrouve l'utilisateur actif correspondant à l'email (None si inexistant).
        email = self.validated_data["email"]
        return User.objects.filter(email__iexact=email, is_active=True).first()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Valide la réinitialisation du mot de passe (uid + token) puis l'applique."""
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    def validate(self, attrs):
        # Contrôle que les deux mots de passe correspondent.
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password2": "Les mots de passe ne correspondent pas."})

        # Décodage de l'uid et récupération de l'utilisateur actif.
        try:
            user_id = force_str(urlsafe_base64_decode(attrs["uid"]))
            user = User.objects.get(pk=user_id, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({"token": "Lien de réinitialisation invalide ou expiré."})

        # Vérification de la validité du token de réinitialisation.
        if not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError({"token": "Lien de réinitialisation invalide ou expiré."})

        attrs["user"] = user
        return attrs

    def save(self):
        # Applique le nouveau mot de passe sur le compte.
        user = self.validated_data["user"]
        user.set_password(self.validated_data["password"])
        user.save(update_fields=["password"])
        return user


class AddressSerializer(serializers.ModelSerializer):
    """Sérialise une adresse de livraison enregistrée (avec la zone de livraison)."""
    zone = serializers.PrimaryKeyRelatedField(queryset=DeliveryZone.objects.all())
    zone_name = serializers.CharField(source="zone.name", read_only=True)

    class Meta:
        model = Address
        fields = [
            "id",
            "label",
            "full_name",
            "phone",
            "zone",
            "zone_name",
            "notes",
            "is_default",
            "created_at",
        ]
        read_only_fields = ["created_at"]
