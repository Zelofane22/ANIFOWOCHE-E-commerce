from rest_framework import serializers

from apps.sellers.models import Shop
from apps.sellers.limits import FREE_MAX_PRODUCTS, can_create_product

from .models import (
    Category,
    Option,
    OptionGroup,
    Product,
    ProductImage,
    is_made_to_order_category,
)


class CategorySerializer(serializers.ModelSerializer):
    """Sérialise une catégorie de produits (plat, usage public/nested)."""

    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class CategoryAdminSerializer(serializers.ModelSerializer):
    """Sérialiseur admin/backoffice : permet de créer/modifier l'arbre."""

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "parent", "level", "order", "is_active"]
        read_only_fields = ["level"]


class CategoryTreeSerializer(serializers.ModelSerializer):
    """Sérialiseur récursif pour l'endpoint `/categories/tree/`."""

    children = serializers.SerializerMethodField()
    is_made_to_order = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "level", "is_made_to_order", "children"]

    def get_is_made_to_order(self, obj):
        return is_made_to_order_category(obj)

    def get_children(self, obj):
        # Affiche uniquement les enfants actifs, triés comme défini dans Meta.
        active_children = obj.children.filter(is_active=True)
        return CategoryTreeSerializer(active_children, many=True).data


class OptionSerializer(serializers.ModelSerializer):
    """Sérialise une option de vente (supplément de prix inclus)."""

    class Meta:
        model = Option
        fields = ["id", "name", "price_xof", "is_default", "order"]


class OptionGroupSerializer(serializers.ModelSerializer):
    """Sérialise un groupe d'options avec ses options imbriquées (CRUD complet)."""

    options = OptionSerializer(many=True, read_only=False)

    class Meta:
        model = OptionGroup
        fields = [
            "id",
            "name",
            "is_required",
            "min_selections",
            "max_selections",
            "order",
            "options",
        ]

    def create(self, validated_data):
        # Création du groupe puis de toutes ses options imbriquées.
        options_data = validated_data.pop("options", [])
        group = OptionGroup.objects.create(**validated_data)
        for option_data in options_data:
            Option.objects.create(group=group, **option_data)
        return group

    def update(self, instance, validated_data):
        # Mise à jour du groupe puis synchronisation des options (création/modification/suppression).
        options_data = validated_data.pop("options", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if options_data is not None:
            kept_ids = []
            for option_data in options_data:
                option_id = option_data.pop("id", None)
                # Mise à jour d'une option existante.
                if option_id:
                    option = Option.objects.filter(pk=option_id, group=instance).first()
                    if option:
                        for attr, value in option_data.items():
                            setattr(option, attr, value)
                        option.save()
                        kept_ids.append(option.pk)
                # Création d'une nouvelle option.
                else:
                    option = Option.objects.create(group=instance, **option_data)
                    kept_ids.append(option.pk)
            # Suppression des options absentes de la liste envoyée.
            instance.options.exclude(pk__in=kept_ids).delete()
        return instance


class ProductImageSerializer(serializers.ModelSerializer):
    """Sérialise une image de la galerie produit."""

    class Meta:
        model = ProductImage
        fields = [
            "id",
            "image",
            "alt_text",
            "color_name",
            "order",
            "is_cover",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["is_active", "created_at", "updated_at"]


class ProductSerializer(serializers.ModelSerializer):
    """Sérialiseur public du produit : données liées, agrégats (note, avis, remise)."""

    category = CategorySerializer(read_only=True)
    seller_id = serializers.IntegerField(read_only=True)
    seller_name = serializers.CharField(
        source="seller.display_name", read_only=True, allow_null=True
    )
    shop_id = serializers.IntegerField(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True
    )
    rating_average = serializers.SerializerMethodField()
    review_count = serializers.IntegerField(read_only=True, default=0)
    discount_percent = serializers.IntegerField(read_only=True, allow_null=True, default=None)
    discounted_price_xof = serializers.SerializerMethodField()
    made_to_order = serializers.BooleanField(read_only=True)
    in_stock = serializers.SerializerMethodField()
    category_path = serializers.SerializerMethodField()
    images = ProductImageSerializer(many=True, read_only=True)
    option_groups = OptionGroupSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "seller_id",
            "seller_name",
            "shop_id",
            "name",
            "slug",
            "description",
            "price_xof",
            "unit",
            "size",
            "stock",
            "made_to_order",
            "in_stock",
            "colors",
            "image",
            "images",
            "option_groups",
            "is_active",
            "category",
            "category_id",
            "category_path",
            "rating_average",
            "review_count",
            "discount_percent",
            "discounted_price_xof",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_rating_average(self, product):
        # Note moyenne arrondie à une décimale (None si aucun avis approuvé).
        average = getattr(product, "rating_average", None)
        return round(average, 1) if average is not None else None

    def get_discounted_price_xof(self, product):
        # Prix effectif après application de la remise promotionnelle (None si pas de remise).
        percent = getattr(product, "discount_percent", None)
        if not percent:
            return None
        return round(product.price_xof * (100 - percent) / 100)

    def get_in_stock(self, product):
        # Disponible si le produit est fabriqué à la commande (aucun stock) ou s'il reste du stock.
        return bool(product.made_to_order or product.stock > 0)

    def get_category_path(self, product):
        # Chemin complet de la catégorie (L1 > L2 > L3) pour l'affichage public.
        if not product.category_id:
            return ""
        parts = []
        current = product.category
        while current:
            parts.insert(0, current.name)
            current = current.parent
        return " > ".join(parts)


class SellerProductSerializer(ProductSerializer):
    """Sérialiseur côté vendeur : ajoute la liaison boutique et la protection d'appartenance."""

    shop_id = serializers.PrimaryKeyRelatedField(
        source="shop", queryset=Shop.objects.all(), write_only=True, required=False
    )

    class Meta(ProductSerializer.Meta):
        read_only_fields = ["slug", "made_to_order", "created_at", "updated_at"]

    def validate(self, attrs):
        # Interdit de rattacher le produit à une boutique qui n'appartient pas au vendeur.
        shop = attrs.get("shop")
        seller = self.context.get("seller")
        if shop and seller and shop.seller != seller:
            raise serializers.ValidationError({"shop_id": "Ce shop ne vous appartient pas."})
        # Limite du plan gratuit : 10 produits actifs maximum (création ou réactivation).
        if seller and self._adds_active_product(attrs) and not can_create_product(seller):
            raise serializers.ValidationError(
                f"Plan gratuit : maximum {FREE_MAX_PRODUCTS} produits actifs. "
                "Archivez un produit ou passez au plan Illimité."
            )
        # Les produits de la branche « Alimentation » sont « sur commande »
        # (aucun stock). La correspondance s'applique à toute la branche,
        # y compris les futures sous-catégories ajoutées par les vendeurs.
        category = attrs.get("category")
        if category is None and self.instance:
            category = self.instance.category
        if category and is_made_to_order_category(category):
            attrs["made_to_order"] = True
        return attrs

    def _adds_active_product(self, attrs):
        # True si la requête crée un produit actif ou réactive un produit archivé.
        if self.instance is None:
            return attrs.get("is_active", True)
        return not self.instance.is_active and attrs.get("is_active") is True

    def create(self, validated_data):
        # Rattache automatiquement le produit à la boutique du vendeur si elle existe.
        seller = self.context.get("seller")
        if seller and "shop" not in validated_data and seller.shop:
            validated_data["shop"] = seller.shop
        return super().create(validated_data)
