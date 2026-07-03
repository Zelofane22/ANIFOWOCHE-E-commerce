from rest_framework import serializers

from apps.products.models import Product

from .models import WishlistItem


class WishlistProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "slug", "price_xof", "image", "stock", "is_active"]


class WishlistItemSerializer(serializers.ModelSerializer):
    product = WishlistProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source="product", write_only=True
    )

    class Meta:
        model = WishlistItem
        fields = ["id", "product", "product_id", "added_at"]
        read_only_fields = ["added_at"]
