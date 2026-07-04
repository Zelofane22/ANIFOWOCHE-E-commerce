from rest_framework import serializers

from apps.products.models import Product

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), source="product", write_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "product_id",
            "product_name",
            "author_name",
            "rating",
            "comment",
            "is_approved",
            "created_at",
        ]
        read_only_fields = ["is_approved", "created_at"]
