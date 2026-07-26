from rest_framework import serializers

from apps.sellers.models import Shop

from .models import Category, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "color_name", "order", "is_cover", "is_active", "created_at", "updated_at"]
        read_only_fields = ["is_active", "created_at", "updated_at"]


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    seller_id = serializers.IntegerField(read_only=True)
    seller_name = serializers.CharField(source="seller.display_name", read_only=True, allow_null=True)
    shop_id = serializers.IntegerField(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True
    )
    rating_average = serializers.SerializerMethodField()
    review_count = serializers.IntegerField(read_only=True, default=0)
    discount_percent = serializers.IntegerField(read_only=True, allow_null=True, default=None)
    discounted_price_xof = serializers.SerializerMethodField()
    images = ProductImageSerializer(many=True, read_only=True)

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
            "colors",
            "image",
            "images",
            "is_active",
            "category",
            "category_id",
            "rating_average",
            "review_count",
            "discount_percent",
            "discounted_price_xof",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_rating_average(self, product):
        average = getattr(product, "rating_average", None)
        return round(average, 1) if average is not None else None

    def get_discounted_price_xof(self, product):
        percent = getattr(product, "discount_percent", None)
        if not percent:
            return None
        return round(product.price_xof * (100 - percent) / 100)


class SellerProductSerializer(ProductSerializer):
    shop_id = serializers.PrimaryKeyRelatedField(source="shop", queryset=Shop.objects.all(), write_only=True, required=False)

    class Meta(ProductSerializer.Meta):
        read_only_fields = ["slug", "created_at", "updated_at"]

    def validate(self, attrs):
        shop = attrs.get("shop")
        seller = self.context.get("seller")
        if shop and seller and shop.seller != seller:
            raise serializers.ValidationError({"shop_id": "Ce shop ne vous appartient pas."})
        return attrs

    def create(self, validated_data):
        seller = self.context.get("seller")
        if seller and "shop" not in validated_data and seller.shop:
            validated_data["shop"] = seller.shop
        return super().create(validated_data)
