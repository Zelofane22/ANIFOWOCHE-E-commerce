from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Prefetch, Q
from django.utils.text import slugify
from rest_framework import serializers

from apps.delivery.models import DeliveryZone
from apps.delivery.serializers import DeliveryZoneSerializer
from apps.notifications.services import notify_order_cancellation
from apps.orders.models import Order
from apps.users.backends import validate_benin_phone
from apps.users.serializers import UserSerializer
from apps.products.models import Product, ProductImage
from apps.products.serializers import ProductSerializer

from .models import SellerProfile, Shop

User = get_user_model()


def seller_frontend_base_url():
    """Base URL du frontend vendeur (repli sur le frontend principal)."""
    return getattr(settings, "SELLER_FRONTEND_BASE_URL", settings.FRONTEND_BASE_URL).rstrip("/")


class ShopSerializer(serializers.ModelSerializer):
    """Sérialise une boutique, avec son lien public complet."""
    delivery_zones = DeliveryZoneSerializer(many=True, read_only=True)
    delivery_zone_ids = serializers.PrimaryKeyRelatedField(
        source="delivery_zones",
        queryset=DeliveryZone.objects.filter(is_active=True),
        many=True,
        required=False,
        write_only=True,
    )
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
            "delivery_zones",
            "delivery_zone_ids",
            "is_published",
            "public_path",
            "public_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "public_path", "public_url"]

    def get_public_url(self, shop):
        # URL publique complète de la boutique (base frontend + chemin).
        return f"{seller_frontend_base_url()}{shop.public_path}"

    def validate_slug(self, value):
        # Slug normalisé (minuscules, sans espaces) et unicité hors instance courante.
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
        # Normalise et valide le numéro WhatsApp au format +22901XXXXXXXX.
        return validate_benin_phone(value)


    def validate(self, attrs):
        if not self.instance:
            return attrs
        name_changed = "name" in attrs and attrs["name"] != self.instance.name
        slug_explicitly_set = "slug" in attrs and attrs.get("slug") != self.instance.slug
        if name_changed and not slug_explicitly_set:
            base = slugify(attrs["name"])[:150] or "boutique"
            slug = base
            suffix = 2
            while Shop.objects.filter(slug=slug).exclude(pk=self.instance.pk).exists():
                slug = f"{base}-{suffix}"
                suffix += 1
            attrs["slug"] = slug
        return attrs

class SellerProfileSerializer(serializers.ModelSerializer):
    """Sérialise le profil vendeur en incluant sa boutique."""
    shop = ShopSerializer()

    class Meta:
        model = SellerProfile
        fields = ["id", "display_name", "phone", "city", "plan", "shop", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at", "plan"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Propage la boutique au sérialiseur imbriqué : sans instance, la validation
        # d'unicité du slug rejetterait le propre slug de la boutique lors d'une mise à jour.
        if self.instance is not None:
            self.fields["shop"].instance = getattr(self.instance, "shop", None)

    def validate_phone(self, value):
        # Normalise et valide le numéro de téléphone au format +22901XXXXXXXX.
        return validate_benin_phone(value)

    def update(self, instance, validated_data):
        # Mise à jour du profil puis de la boutique imbriquée (si fournie).
        shop_data = validated_data.pop("shop", None)
        instance = super().update(instance, validated_data)
        if shop_data:
            delivery_zones = shop_data.pop("delivery_zones", None)
            shop_serializer = ShopSerializer(instance.shop, data=shop_data, partial=True)
            shop_serializer.is_valid(raise_exception=True)
            shop_serializer.save()
            if delivery_zones is not None:
                instance.shop.delivery_zones.set(delivery_zones)
        return instance


class SellerOrderStatusSerializer(serializers.ModelSerializer):
    """Mise à jour du statut d'une commande côté vendeur (avec motif d'annulation)."""
    cancellation_reason = serializers.CharField(required=False, allow_blank=True, default="")

    class Meta:
        model = Order
        fields = ["status", "cancellation_reason"]

    def validate(self, attrs):
        # Annulation impossible si la commande n'est pas dans un statut annulable.
        status = attrs.get("status")
        if status == Order.Status.CANCELLED and self.instance:
            if self.instance.status not in Order.CANCELLABLE_STATUSES:
                raise serializers.ValidationError(
                    {"status": f"Impossible d'annuler une commande avec le statut « {self.instance.get_status_display()} »."}
                )
        # Toute modification de statut est interdite une fois la commande annulée.
        if status != self.instance.status and status != Order.Status.CANCELLED:
            if self.instance.status == Order.Status.CANCELLED:
                raise serializers.ValidationError(
                    {"status": "Impossible de modifier le statut d'une commande annulée."}
                )
        return attrs

    def update(self, instance, validated_data):
        # Annulation : appelle le modèle (re-stock) puis notifie le client.
        status = validated_data.get("status", instance.status)
        if status == Order.Status.CANCELLED and instance.status != Order.Status.CANCELLED:
            reason = validated_data.get("cancellation_reason", "")
            instance.cancel(reason=reason)
            notify_order_cancellation(instance, reason=reason)
            return instance
        # Changement de statut simple (interdit sur une commande déjà annulée).
        if status != instance.status:
            if instance.status == Order.Status.CANCELLED:
                raise serializers.ValidationError(
                    {"status": "Impossible de modifier le statut d'une commande annulée."}
                )
            instance.status = status
            instance.save(update_fields=["status"])
        return instance


class SellerRegisterSerializer(serializers.Serializer):
    """Inscription d'un vendeur : compte utilisateur + profil vendeur + boutique."""
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
        # Unicité du nom d'utilisateur (insensible à la casse).
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà utilisé.")
        return value

    def validate_email(self, value):
        # Unicité de l'adresse email si fournie.
        if value and User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un compte existe déjà avec cet email.")
        return value

    def validate_phone(self, value):
        # Normalise et valide le numéro de téléphone au format +22901XXXXXXXX.
        return validate_benin_phone(value)

    def validate_shop_slug(self, value):
        # Slug de boutique normalisé et unique.
        if value and Shop.objects.filter(slug=value.lower()).exists():
            raise serializers.ValidationError("Ce lien boutique est déjà utilisé.")
        return value.lower() if value else value

    def validate(self, attrs):
        # Contrôle que les deux mots de passe correspondent.
        password2 = attrs.pop("password2")
        if attrs["password"] != password2:
            raise serializers.ValidationError({"password2": "Les mots de passe ne correspondent pas."})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        # Extraction des données spécifiques vendeur/boutique hors du bloc utilisateur.
        display_name = validated_data.pop("display_name")
        phone = validated_data.pop("phone")
        city = validated_data.pop("city", "")
        shop_name = validated_data.pop("shop_name")
        shop_slug = validated_data.pop("shop_slug", "")
        shop_description = validated_data.pop("shop_description", "")
        # Création atomique du compte, du profil vendeur et de la boutique.
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
    """Sérialise la réponse du tableau de bord vendeur."""
    seller = SellerProfileSerializer()
    metrics = serializers.DictField()


class PublicShopSerializer(serializers.ModelSerializer):
    """Sérialise la vitrine publique d'une boutique avec ses produits."""
    delivery_zones = DeliveryZoneSerializer(many=True, read_only=True)
    public_path = serializers.CharField(read_only=True)
    products = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = ["id", "name", "slug", "whatsapp_phone", "city", "description", "delivery_zones", "public_path", "products"]

    def get_products(self, shop):
        # Produits actifs de la boutique (ou du vendeur), avec images, triés par mise à jour.
        products = (
            Product.objects.filter(
                Q(shop=shop) | Q(shop__isnull=True, seller=shop.seller),
                is_active=True,
            )
            .select_related("category")
            .prefetch_related(
                Prefetch(
                    "images",
                    queryset=ProductImage.objects.filter(is_active=True).order_by("order", "created_at"),
                )
            )
            .order_by("-updated_at")
        )
        return ProductSerializer(products, many=True, context=self.context).data
