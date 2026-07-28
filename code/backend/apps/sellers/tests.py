from unittest import mock

import requests
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.core.factories import (
    CategoryFactory,
    OrderFactory,
    OrderItemFactory,
    ProductFactory,
    SellerProfileFactory,
    ShopFactory,
    UserFactory,
)
from apps.orders.models import Order, OrderItem
from apps.products.models import Category, Product

from .models import SellerProfile, Shop

User = get_user_model()


class SellerApiTests(APITestCase):
    def test_seller_register_creates_user_profile_shop_and_tokens(self):
        payload = {
            "username": "vendeuse",
            "email": "vendeuse@example.com",
            "password": "StrongPass123!",
            "password2": "StrongPass123!",
            "display_name": "Afi Boutique",
            "phone": "+22990000000",
            "city": "Cotonou",
            "shop_name": "Afi Wax",
            "shop_slug": "afi-wax",
            "shop_description": "Tissus et accessoires",
        }

        response = self.client.post("/api/seller/register/", payload, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertIn("access", response.data)
        self.assertEqual(response.data["seller"]["display_name"], "Afi Boutique")
        self.assertEqual(response.data["seller"]["shop"]["slug"], "afi-wax")
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(SellerProfile.objects.count(), 1)
        self.assertEqual(Shop.objects.count(), 1)

    def test_seller_register_rejects_duplicate_slug(self):
        user = UserFactory(username="owner")
        seller = SellerProfileFactory(user=user, display_name="Owner", phone="+22990000000")
        ShopFactory(seller=seller, name="Afi Wax", whatsapp_phone="+22990000000")

        response = self.client.post(
            "/api/seller/register/",
            {
                "username": "vendeuse",
                "password": "StrongPass123!",
                "password2": "StrongPass123!",
                "display_name": "Afi Boutique",
                "phone": "+22991000000",
                "shop_name": "Afi Wax",
                "shop_slug": "afi-wax",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(User.objects.count(), 1)

    def test_authenticated_seller_can_read_and_update_profile(self):
        user = UserFactory(username="vendeuse")
        seller = SellerProfileFactory(user=user, display_name="Afi Boutique", phone="+22990000000")
        ShopFactory(seller=seller, name="Afi Wax", whatsapp_phone="+22990000000")
        self.client.force_authenticate(user=user)

        response = self.client.get("/api/seller/profile/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["shop"]["public_path"], "/shop/afi-wax")

        patch_response = self.client.patch(
            "/api/seller/profile/",
            {
                "display_name": "Afi Seller",
                "city": "Porto-Novo",
                "shop": {"name": "Afi Mode", "city": "Porto-Novo", "description": "Mode femme"},
            },
            format="json",
        )
        self.assertEqual(patch_response.status_code, 200)
        seller.refresh_from_db()
        seller.shop.refresh_from_db()
        self.assertEqual(seller.display_name, "Afi Seller")
        self.assertEqual(seller.shop.name, "Afi Mode")

    def test_public_shop_is_available_by_slug(self):
        user = UserFactory(username="vendeuse")
        seller = SellerProfileFactory(user=user, display_name="Afi Boutique", phone="+22990000000")
        ShopFactory(
            seller=seller,
            name="Afi Wax",
            whatsapp_phone="+22990000000",
            city="Cotonou",
        )

        response = self.client.get("/api/public/shops/afi-wax/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["name"], "Afi Wax")

    def test_public_shop_returns_only_active_seller_products(self):
        category = CategoryFactory(name="Tissus", slug="tissus")
        user = UserFactory(username="vendeuse")
        seller = SellerProfileFactory(user=user, display_name="Afi Boutique", phone="+22990000000")
        ShopFactory(seller=seller, name="Afi Wax", whatsapp_phone="+22990000000")
        other_user = UserFactory(username="autre")
        other_seller = SellerProfileFactory(user=other_user, display_name="Autre", phone="+22991000000")
        ProductFactory(
            seller=seller,
            category=category,
            name="Pagne publié",
            slug="pagne-publie",
            price_xof=5000,
            stock=5,
        )
        ProductFactory(
            seller=seller,
            category=category,
            name="Pagne archivé",
            slug="pagne-archive",
            price_xof=4000,
            stock=0,
            is_active=False,
        )
        ProductFactory(
            seller=other_seller,
            category=category,
            name="Produit autre",
            slug="produit-autre",
            price_xof=6000,
            stock=5,
        )

        response = self.client.get("/api/public/shops/afi-wax/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual([product["slug"] for product in response.data["products"]], ["pagne-publie"])

    def test_dashboard_requires_authenticated_seller(self):
        response = self.client.get("/api/seller/dashboard/")
        self.assertEqual(response.status_code, 401)

    def test_seller_dashboard_includes_order_metrics(self):
        category = CategoryFactory(name="Tissus", slug="tissus")
        user = UserFactory(username="vendeuse")
        seller = SellerProfileFactory(user=user, display_name="Afi Boutique", phone="+22990000000")
        ShopFactory(seller=seller, name="Afi Wax", whatsapp_phone="+22990000000")
        product = ProductFactory(
            seller=seller,
            category=category,
            name="Pagne",
            slug="pagne",
            price_xof=5000,
            stock=5,
        )
        customer = UserFactory(username="client")
        order = OrderFactory(
            customer=customer,
            full_name="M. Client",
            phone="+22991111111",
            email="client@example.com",
            address="Rue des Cocotiers",
            city="Cotonou",
            status=Order.Status.RECEIVED,
        )
        OrderItemFactory(order=order, product=product, quantity=2, unit_price_xof=5000)

        self.client.force_authenticate(user=user)
        response = self.client.get("/api/seller/dashboard/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["metrics"]["orders_today"], 1)
        self.assertEqual(response.data["metrics"]["pending_orders"], 1)

    def test_seller_orders_list_returns_only_their_orders(self):
        category = CategoryFactory(name="Tissus", slug="tissus")
        seller_user = UserFactory(username="vendeuse")
        seller = SellerProfileFactory(user=seller_user, display_name="Afi Boutique", phone="+22990000000")
        ShopFactory(seller=seller, name="Afi Wax", whatsapp_phone="+22990000000")
        product = ProductFactory(
            seller=seller,
            category=category,
            name="Pagne",
            slug="pagne",
            price_xof=5000,
            stock=5,
        )
        other_user = UserFactory(username="autre")
        other_seller = SellerProfileFactory(user=other_user, display_name="Autre Boutique", phone="+22991000000")
        ShopFactory(seller=other_seller, name="Autre Shop", whatsapp_phone="+22991000000")
        other_product = ProductFactory(
            seller=other_seller,
            category=category,
            name="Autre Pagne",
            slug="autre-pagne",
            price_xof=6000,
            stock=5,
        )

        customer = UserFactory(username="client")
        order = OrderFactory(
            customer=customer,
            full_name="M. Client",
            phone="+22991111111",
            email="client@example.com",
            address="Rue des Cocotiers",
            city="Cotonou",
            status=Order.Status.RECEIVED,
        )
        OrderItemFactory(order=order, product=product, quantity=1, unit_price_xof=5000)

        other_order = OrderFactory(
            customer=customer,
            full_name="Mme Autre",
            phone="+22992222222",
            email="autre@example.com",
            address="Rue des Palmiers",
            city="Porto-Novo",
            status=Order.Status.RECEIVED,
        )
        OrderItemFactory(order=other_order, product=other_product, quantity=1, unit_price_xof=6000)

        self.client.force_authenticate(user=seller_user)
        response = self.client.get("/api/seller/orders/")

        self.assertEqual(response.status_code, 200)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["full_name"], "M. Client")
        self.assertEqual(results[0]["items"][0]["product_slug"], "pagne")

    def test_seller_can_update_order_status(self):
        category = CategoryFactory(name="Tissus", slug="tissus")
        seller_user = UserFactory(username="vendeuse")
        seller = SellerProfileFactory(user=seller_user, display_name="Afi Boutique", phone="+22990000000")
        ShopFactory(seller=seller, name="Afi Wax", whatsapp_phone="+22990000000")
        product = ProductFactory(
            seller=seller,
            category=category,
            name="Pagne",
            slug="pagne",
            price_xof=5000,
            stock=5,
        )
        customer = UserFactory(username="client")
        order = OrderFactory(
            customer=customer,
            full_name="M. Client",
            phone="+22991111111",
            email="client@example.com",
            address="Rue des Cocotiers",
            city="Cotonou",
            status=Order.Status.RECEIVED,
        )
        OrderItemFactory(order=order, product=product, quantity=1, unit_price_xof=5000)

        self.client.force_authenticate(user=seller_user)
        response = self.client.patch(f"/api/seller/orders/{order.id}/", {"status": "prepared"}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "prepared")
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.PREPARED)

    @mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_seller_can_cancel_received_order(self, mock_post):
        category = CategoryFactory(name="Tissus", slug="tissus")
        seller_user = UserFactory(username="vendeuse")
        seller = SellerProfileFactory(user=seller_user, display_name="Afi Boutique", phone="+22990000000")
        ShopFactory(seller=seller, name="Afi Wax", whatsapp_phone="+22990000000")
        product = ProductFactory(
            seller=seller,
            category=category,
            name="Pagne",
            slug="pagne",
            price_xof=5000,
            stock=5,
        )
        customer = UserFactory(username="client")
        order = OrderFactory(
            customer=customer,
            full_name="M. Client",
            phone="+22991111111",
            email="client@example.com",
            address="Rue des Cocotiers",
            city="Cotonou",
            status=Order.Status.RECEIVED,
        )
        OrderItemFactory(order=order, product=product, quantity=2, unit_price_xof=5000)

        self.client.force_authenticate(user=seller_user)
        response = self.client.patch(
            f"/api/seller/orders/{order.id}/",
            {"status": "cancelled", "cancellation_reason": "Plus en stock"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.CANCELLED)
        self.assertEqual(order.cancellation_reason, "Plus en stock")
        self.assertIsNotNone(order.cancelled_at)

    @mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_cancellation_restores_stock(self, mock_post):
        category = CategoryFactory(name="Tissus", slug="tissus")
        seller_user = UserFactory(username="vendeuse")
        seller = SellerProfileFactory(user=seller_user, display_name="Afi Boutique", phone="+22990000000")
        ShopFactory(seller=seller, name="Afi Wax", whatsapp_phone="+22990000000")
        product = ProductFactory(
            seller=seller,
            category=category,
            name="Pagne",
            slug="pagne",
            price_xof=5000,
            stock=5,
        )
        customer = UserFactory(username="client")
        order = OrderFactory(
            customer=customer,
            full_name="M. Client",
            phone="+22991111111",
            email="client@example.com",
            address="Rue des Cocotiers",
            city="Cotonou",
            status=Order.Status.RECEIVED,
        )
        OrderItemFactory(order=order, product=product, quantity=2, unit_price_xof=5000)

        self.client.force_authenticate(user=seller_user)
        response = self.client.patch(
            f"/api/seller/orders/{order.id}/",
            {"status": "cancelled"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        product.refresh_from_db()
        self.assertEqual(product.stock, 7)

    def test_cannot_cancel_delivered_order(self):
        category = CategoryFactory(name="Tissus", slug="tissus")
        seller_user = UserFactory(username="vendeuse")
        seller = SellerProfileFactory(user=seller_user, display_name="Afi Boutique", phone="+22990000000")
        ShopFactory(seller=seller, name="Afi Wax", whatsapp_phone="+22990000000")
        product = ProductFactory(
            seller=seller,
            category=category,
            name="Pagne",
            slug="pagne",
            price_xof=5000,
            stock=5,
        )
        customer = UserFactory(username="client")
        order = OrderFactory(
            customer=customer,
            full_name="M. Client",
            phone="+22991111111",
            email="client@example.com",
            address="Rue des Cocotiers",
            city="Cotonou",
            status=Order.Status.DELIVERED,
        )
        OrderItemFactory(order=order, product=product, quantity=1, unit_price_xof=5000)

        self.client.force_authenticate(user=seller_user)
        response = self.client.patch(
            f"/api/seller/orders/{order.id}/",
            {"status": "cancelled"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.DELIVERED)

    def test_cannot_update_cancelled_order(self):
        category = CategoryFactory(name="Tissus", slug="tissus")
        seller_user = UserFactory(username="vendeuse")
        seller = SellerProfileFactory(user=seller_user, display_name="Afi Boutique", phone="+22990000000")
        ShopFactory(seller=seller, name="Afi Wax", whatsapp_phone="+22990000000")
        product = ProductFactory(
            seller=seller,
            category=category,
            name="Pagne",
            slug="pagne",
            price_xof=5000,
            stock=5,
        )
        customer = UserFactory(username="client")
        order = OrderFactory(
            customer=customer,
            full_name="M. Client",
            phone="+22991111111",
            email="client@example.com",
            address="Rue des Cocotiers",
            city="Cotonou",
            status=Order.Status.CANCELLED,
        )
        OrderItemFactory(order=order, product=product, quantity=1, unit_price_xof=5000)

        self.client.force_authenticate(user=seller_user)
        response = self.client.patch(
            f"/api/seller/orders/{order.id}/",
            {"status": "prepared"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
