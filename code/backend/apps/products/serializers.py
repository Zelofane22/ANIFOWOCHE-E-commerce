from rest_framework import serializers

from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True
    )
    rating_average = serializers.SerializerMethodField()
    review_count = serializers.IntegerField(read_only=True, default=0)
    discount_percent = serializers.IntegerField(read_only=True, allow_null=True, default=None)
    discounted_price_xof = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "price_xof",
            "unit",
            "size",
            "stock",
            "image",
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
