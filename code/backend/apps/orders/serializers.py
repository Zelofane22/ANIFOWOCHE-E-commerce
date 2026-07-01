from rest_framework import serializers

from apps.notifications.services import notify_order_confirmation
from apps.products.models import Product

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source="product", write_only=True
    )
    product_name = serializers.CharField(source="product.name", read_only=True)
    subtotal_xof = serializers.IntegerField(read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product_id",
            "product_name",
            "quantity",
            "unit_price_xof",
            "subtotal_xof",
        ]
        read_only_fields = ["unit_price_xof"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "full_name",
            "phone",
            "email",
            "address",
            "city",
            "status",
            "total_xof",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["total_xof", "created_at", "updated_at"]

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("Une commande doit contenir au moins un article.")
        return items

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        request = self.context.get("request")
        customer = request.user if request and request.user.is_authenticated else None

        order = Order.objects.create(customer=customer, **validated_data)

        total = 0
        for item_data in items_data:
            product = item_data["product"]
            quantity = item_data["quantity"]
            unit_price = product.price_xof
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                unit_price_xof=unit_price,
            )
            total += quantity * unit_price

        order.total_xof = total
        order.save(update_fields=["total_xof"])

        notify_order_confirmation(order)

        return order
