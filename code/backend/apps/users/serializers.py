from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers

from apps.delivery.models import DeliveryZone

from .models import Address, Profile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    notification_channel = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_staff", "notification_channel", "phone"]

    def get_notification_channel(self, user):
        profile = getattr(user, "profile", None)
        return profile.notification_channel if profile else Profile.NotificationChannel.EMAIL

    def get_phone(self, user):
        profile = getattr(user, "profile", None)
        return profile.phone if profile else ""


class RegisterSerializer(serializers.ModelSerializer):
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
        if value and User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un compte existe déjà avec cet email.")
        return value

    def validate(self, attrs):
        password2 = attrs.pop("password2")
        if attrs["password"] != password2:
            raise serializers.ValidationError({"password2": "Les mots de passe ne correspondent pas."})
        return attrs

    def create(self, validated_data):
        phone = validated_data.pop("phone", "")
        notification_channel = validated_data.pop("notification_channel", Profile.NotificationChannel.EMAIL)
        with transaction.atomic():
            user = User.objects.create_user(**validated_data)
            Profile.objects.create(user=user, phone=phone, notification_channel=notification_channel)
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def get_user(self):
        email = self.validated_data["email"]
        return User.objects.filter(email__iexact=email, is_active=True).first()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password2": "Les mots de passe ne correspondent pas."})

        try:
            user_id = force_str(urlsafe_base64_decode(attrs["uid"]))
            user = User.objects.get(pk=user_id, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({"token": "Lien de réinitialisation invalide ou expiré."})

        if not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError({"token": "Lien de réinitialisation invalide ou expiré."})

        attrs["user"] = user
        return attrs

    def save(self):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["password"])
        user.save(update_fields=["password"])
        return user


class AddressSerializer(serializers.ModelSerializer):
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
