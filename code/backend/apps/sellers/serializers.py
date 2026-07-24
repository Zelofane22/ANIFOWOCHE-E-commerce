from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers

from apps.users.backends import normalize_phone
from apps.users.serializers import UserSerializer

from .models import SellerProfile, Shop

User = get_user_model()


def seller_frontend_base_url():
    return getattr(settings, "SELLER_FRONTEND_BASE_URL", settings.FRONTEND_BASE_URL).rstrip("/")


class ShopSerializer(serializers.ModelSerializer):
    public_path = serializers.CharField(read_only=True)
    public_url = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = [
            "id",
            "name",
            "slug",
            "whatsapp_phone",
            "city",
            "description",
            "is_published",
            "public_path",
            "public_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "public_path", "public_url"]

    def get_public_url(self, shop):
        return f"{seller_frontend_base_url()}{shop.public_path}"

    def validate_slug(self, value):
        slug = value.strip().lower()
        if not slug:
            raise serializers.ValidationError("Le slug est requis.")

        queryset = Shop.objects.filter(slug=slug)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Ce lien boutique est déjà utilisé.")
        return slug

    def validate_whatsapp_phone(self, value):
        return normalize_phone(value) if value else value


class SellerProfileSerializer(serializers.ModelSerializer):
    shop = ShopSerializer()

    class Meta:
        model = SellerProfile
        fields = ["id", "display_name", "phone", "city", "shop", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]

    def validate_phone(self, value):
        return normalize_phone(value) if value else value

    def update(self, instance, validated_data):
        shop_data = validated_data.pop("shop", None)
        instance = super().update(instance, validated_data)
        if shop_data:
            shop_serializer = ShopSerializer(instance.shop, data=shop_data, partial=True)
            shop_serializer.is_valid(raise_exception=True)
            shop_serializer.save()
        return instance


class SellerRegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    display_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=30)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    shop_name = serializers.CharField(max_length=150)
    shop_slug = serializers.SlugField(max_length=180, required=False, allow_blank=True)
    shop_description = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà utilisé.")
        return value

    def validate_email(self, value):
        if value and User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un compte existe déjà avec cet email.")
        return value

    def validate_phone(self, value):
        return normalize_phone(value)

    def validate_shop_slug(self, value):
        if value and Shop.objects.filter(slug=value.lower()).exists():
            raise serializers.ValidationError("Ce lien boutique est déjà utilisé.")
        return value.lower() if value else value

    def validate(self, attrs):
        password2 = attrs.pop("password2")
        if attrs["password"] != password2:
            raise serializers.ValidationError({"password2": "Les mots de passe ne correspondent pas."})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        display_name = validated_data.pop("display_name")
        phone = validated_data.pop("phone")
        city = validated_data.pop("city", "")
        shop_name = validated_data.pop("shop_name")
        shop_slug = validated_data.pop("shop_slug", "")
        shop_description = validated_data.pop("shop_description", "")
        user = User.objects.create_user(**validated_data)
        seller = SellerProfile.objects.create(user=user, display_name=display_name, phone=phone, city=city)
        Shop.objects.create(
            seller=seller,
            name=shop_name,
            slug=shop_slug,
            whatsapp_phone=phone,
            city=city,
            description=shop_description,
        )
        return user


class SellerDashboardSerializer(serializers.Serializer):
    seller = SellerProfileSerializer()
    metrics = serializers.DictField()


class PublicShopSerializer(serializers.ModelSerializer):
    public_path = serializers.CharField(read_only=True)

    class Meta:
        model = Shop
        fields = ["id", "name", "slug", "whatsapp_phone", "city", "description", "public_path"]
