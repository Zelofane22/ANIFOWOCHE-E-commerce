from rest_framework import serializers

from apps.notifications.services import notify_order_confirmation
from apps.products.models import Product
from apps.promotions.models import Coupon

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
    coupon_code = serializers.CharField(required=False, allow_blank=True, default="")

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
            "coupon_code",
            "discount_xof",
            "total_xof",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["discount_xof", "total_xof", "created_at", "updated_at"]

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("Une commande doit contenir au moins un article.")
        return items

    def validate_coupon_code(self, value):
        code = value.strip()
        if not code:
            return ""
        coupon = Coupon.objects.filter(code__iexact=code).first()
        if not coupon or not coupon.is_valid():
            raise serializers.ValidationError("Code coupon invalide ou expiré.")
        return code

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        coupon_code = validated_data.pop("coupon_code", "") or ""
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

        discount = 0
        coupon = Coupon.objects.filter(code__iexact=coupon_code).first() if coupon_code else None
        if coupon:
            discount = round(total * coupon.discount_percent / 100)
            order.coupon_code = coupon.code
            coupon.used_count += 1
            coupon.save(update_fields=["used_count"])

        order.discount_xof = discount
        order.total_xof = max(total - discount, 0)
        order.save(update_fields=["total_xof", "discount_xof", "coupon_code"])

        notify_order_confirmation(order)

        return order
