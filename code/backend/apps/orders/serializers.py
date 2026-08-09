from django.db import models
from rest_framework import serializers

from apps.notifications.services import notify_order_confirmation, notify_seller_new_order
from apps.payments.serializers import PaymentSerializer
from apps.products.models import MADE_TO_ORDER_CATEGORY_SLUGS, Product
from apps.delivery.models import DeliveryZone
from apps.delivery.serializers import DeliveryZoneSerializer
from apps.promotions.models import Coupon
from apps.users.backends import validate_benin_phone

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    """Sérialise une ligne de commande avec un aperçu du produit associé."""
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source="product",
        write_only=True,
        # Message lisible si le produit n'existe plus au catalogue (évite le
        # brut DRF « Clé primaire « NN » non valide - l'objet n'existe pas. »)
        # — issue JAVASCRIPT-REACT-S.
        error_messages={"does_not_exist": "Ce produit n'est plus disponible au catalogue."},
    )
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.SlugField(source="product.slug", read_only=True)
    product_image = serializers.ImageField(source="product.image", read_only=True)
    subtotal_xof = serializers.IntegerField(read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product_id",
            "product_name",
            "product_slug",
            "product_image",
            "quantity",
            "unit_price_xof",
            "subtotal_xof",
            "color_name",
            "color_hex",
            "selected_options",
        ]
        read_only_fields = ["unit_price_xof"]

    def validate(self, attrs):
        product = attrs["product"]
        selected_options = attrs.get("selected_options") or []
        groups = {str(group.id): group for group in product.option_groups.prefetch_related("options").all()}
        selected_by_group = {}
        is_restaurant_product = product.category.slug in MADE_TO_ORDER_CATEGORY_SLUGS
        normalized_options = []

        for selected in selected_options:
            if not isinstance(selected, dict):
                raise serializers.ValidationError({"selected_options": "Format d'option invalide."})

            group = groups.get(str(selected.get("group_id", "")))
            if group is None:
                raise serializers.ValidationError({"selected_options": "Le groupe d'option est invalide pour ce produit."})

            option_id = str(selected.get("option_id", ""))
            option = next((item for item in group.options.all() if str(item.id) == option_id), None)
            if option is None:
                raise serializers.ValidationError({"selected_options": "L'option est invalide pour ce produit."})

            group_key = str(group.id)
            selected_by_group.setdefault(group_key, [])
            if option.id in selected_by_group[group_key]:
                raise serializers.ValidationError({"selected_options": "Une option ne peut pas être sélectionnée deux fois."})
            selected_by_group[group_key].append(option.id)
            normalized_options.append({
                "group_id": group.id,
                "group_name": group.name,
                "option_id": option.id,
                "option_name": option.name,
                "price_xof": option.price_xof,
            })

        for group in groups.values():
            count = len(selected_by_group.get(str(group.id), []))
            minimum = max(1, group.min_selections) if group.is_required and not is_restaurant_product else 0
            if count < minimum:
                raise serializers.ValidationError({
                    "selected_options": f"Le groupe « {group.name} » nécessite au moins {minimum} option(s)."
                })
            if group.max_selections and count > group.max_selections:
                raise serializers.ValidationError({
                    "selected_options": f"Le groupe « {group.name} » accepte au maximum {group.max_selections} option(s)."
                })

        attrs["selected_options"] = normalized_options
        return attrs


class OrderSerializer(serializers.ModelSerializer):
    """Sérialise une commande complète (articles, coupon, infos de paiement) et gère sa création."""
    items = OrderItemSerializer(many=True)
    delivery_zone_id = serializers.PrimaryKeyRelatedField(
        queryset=DeliveryZone.objects.all(), source="delivery_zone", write_only=True, required=False
    )
    delivery_zone = DeliveryZoneSerializer(read_only=True)
    coupon_code = serializers.CharField(required=False, allow_blank=True, default="")
    payment_info = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "full_name",
            "phone",
            "email",
            "address",
            "city",
            "latitude",
            "longitude",
            "delivery_zone",
            "delivery_zone_id",
            "status",
            "coupon_code",
            "discount_xof",
            "total_xof",
            "items",
            "payment_info",
            "cancelled_at",
            "cancellation_reason",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["discount_xof", "total_xof", "cancelled_at", "cancellation_reason", "created_at", "updated_at"]

    def get_payment_info(self, obj):
        # Renvoie le dernier paiement de la commande (None si aucun).
        latest = obj.payments.order_by("-created_at").first()
        if not latest:
            return None
        return PaymentSerializer(latest).data

    def validate_items(self, items):
        # Une commande ne peut pas être vide.
        if not items:
            raise serializers.ValidationError("Une commande doit contenir au moins un article.")
        return items

    def validate_coupon_code(self, value):
        # Vérifie que le code coupon existe et est encore valide.
        code = value.strip()
        if not code:
            return ""
        coupon = Coupon.objects.filter(code__iexact=code).first()
        if not coupon or not coupon.is_valid():
            raise serializers.ValidationError("Code coupon invalide ou expiré.")
        return code

    def validate_phone(self, value):
        # Normalise et valide le numéro de téléphone au format +22901XXXXXXXX.
        return validate_benin_phone(value)

    def create(self, validated_data):
        # Extraction des articles et du code coupon hors des champs de la commande.
        items_data = validated_data.pop("items")
        coupon_code = validated_data.pop("coupon_code", "") or ""
        delivery_zone = validated_data.pop("delivery_zone", None)
        # Rattachement au client s'il est authentifié.
        request = self.context.get("request")
        customer = request.user if request and request.user.is_authenticated else None

        order = Order.objects.create(customer=customer, **validated_data)

        # Création des lignes, calcul du total et mise à jour des stocks.
        total = 0
        for item_data in items_data:
            product = item_data["product"]
            quantity = item_data["quantity"]
            unit_price = product.price_xof
            color_name = item_data.get("color_name", "")
            color_hex = item_data.get("color_hex", "")
            selected_options = item_data.get("selected_options", [])
            options_total = sum(opt.get("price_xof", 0) for opt in selected_options)
            # Création de la ligne de commande.
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                unit_price_xof=unit_price,
                color_name=color_name,
                color_hex=color_hex,
                selected_options=selected_options,
            )
            total += quantity * (unit_price + options_total)

            # Pas de suivi de stock pour les produits fabriqués à la commande.
            if not product.made_to_order:
                # Décrémente le stock de la couleur choisie (si le produit a des couleurs).
                if color_name and product.colors:
                    colors = product.colors
                    for color in colors:
                        if color["name"] == color_name:
                            color["stock"] = max(color.get("stock", 0) - quantity, 0)
                            break
                    Product.objects.filter(pk=product.pk).update(colors=colors)

                # Décrémente le stock global du produit.
                Product.objects.filter(pk=product.pk).update(
                    stock=models.F("stock") - quantity
                )

        # Application de la remise coupon si un code valide a été fourni.
        discount = 0
        coupon = Coupon.objects.filter(code__iexact=coupon_code).first() if coupon_code else None
        if coupon:
            discount = round(total * coupon.discount_percent / 100)
            order.coupon_code = coupon.code
            coupon.used_count += 1
            coupon.save(update_fields=["used_count"])

        # Enregistrement du total après remise.
        order.discount_xof = discount
        order.total_xof = max(total - discount, 0)
        update_fields = ["total_xof", "discount_xof", "coupon_code"]
        if delivery_zone:
            order.delivery_zone = delivery_zone
            order.total_xof += delivery_zone.fee_xof
            update_fields.extend(["delivery_zone", "total_xof"])
        order.save(update_fields=update_fields)

        # Notification de confirmation au client.
        notify_order_confirmation(order)

        # Notification email aux vendeurs concernés.
        notify_seller_new_order(order)

        return order
