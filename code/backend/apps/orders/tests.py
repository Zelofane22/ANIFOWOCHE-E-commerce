from unittest import mock

import requests
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.core.models import StoreSettings
from apps.products.models import Category, Product
from apps.promotions.models import Coupon

from .models import Order

User = get_user_model()


class OrderApiTests(APITestCase):
    def setUp(self):
        category = Category.objects.create(name="Tissus", slug="tissus")
        self.product = Product.objects.create(
            category=category, name="Pagne", slug="pagne", price_xof=2000, stock=10
        )
        self.staff_user = User.objects.create_user(username="admin", password="pass1234", is_staff=True)
        self.regular_user = User.objects.create_user(username="client", password="pass1234")

    @mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_create_order_computes_total_and_snapshots_price(self, mock_post):
        self.client.force_authenticate(user=self.regular_user)
        payload = {
            "full_name": "Jean Client",
            "phone": "+22990000000",
            "address": "Fidjrossè",
            "items": [{"product_id": self.product.id, "quantity": 3}],
        }
        response = self.client.post("/api/orders/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["total_xof"], 6000)
        self.assertEqual(response.data["items"][0]["unit_price_xof"], 2000)
        self.assertEqual(Order.objects.count(), 1)
        self.assertEqual(Order.objects.get().customer, self.regular_user)

    def test_anonymous_cannot_create_order(self):
        payload = {
            "full_name": "Jean Client",
            "phone": "+22990000000",
            "address": "Fidjrossè",
            "items": [{"product_id": self.product.id, "quantity": 1}],
        }
        response = self.client.post("/api/orders/", payload, format="json")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(Order.objects.count(), 0)

    def test_create_order_blocked_during_maintenance_mode(self):
        StoreSettings.objects.update_or_create(pk=1, defaults={"maintenance_mode": True})
        self.client.force_authenticate(user=self.regular_user)
        payload = {
            "full_name": "Jean Client",
            "phone": "+22990000000",
            "address": "Fidjrossè",
            "items": [{"product_id": self.product.id, "quantity": 1}],
        }
        response = self.client.post("/api/orders/", payload, format="json")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(Order.objects.count(), 0)

    def test_create_order_requires_at_least_one_item(self):
        self.client.force_authenticate(user=self.regular_user)
        payload = {"full_name": "Jean", "phone": "+22990000000", "address": "Fidjrossè", "items": []}
        response = self.client.post("/api/orders/", payload, format="json")
        self.assertEqual(response.status_code, 400)

    def test_anonymous_cannot_list_orders(self):
        response = self.client.get("/api/orders/")
        self.assertEqual(response.status_code, 401)

    @mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_non_staff_can_list_own_orders_only(self, mock_post):
        owner = User.objects.create_user(username="owner", password="pass1234")
        self.client.force_authenticate(user=owner)
        create_response = self.client.post(
            "/api/orders/",
            {
                "full_name": "Jean",
                "phone": "+22990000000",
                "address": "Fidjrossè",
                "items": [{"product_id": self.product.id, "quantity": 1}],
            },
            format="json",
        )
        order_id = create_response.data["id"]

        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/orders/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 0)

        detail_response = self.client.get(f"/api/orders/{order_id}/")
        self.assertEqual(detail_response.status_code, 404)

        self.client.force_authenticate(user=owner)
        own_response = self.client.get("/api/orders/")
        self.assertEqual(own_response.status_code, 200)
        self.assertEqual(own_response.data["count"], 1)
        self.assertEqual(own_response.data["results"][0]["id"], order_id)

    @mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_staff_can_list_and_update_order_status(self, mock_post):
        self.client.force_authenticate(user=self.regular_user)
        create_response = self.client.post(
            "/api/orders/",
            {
                "full_name": "Jean",
                "phone": "+22990000000",
                "address": "Fidjrossè",
                "items": [{"product_id": self.product.id, "quantity": 1}],
            },
            format="json",
        )
        order_id = create_response.data["id"]

        self.client.force_authenticate(user=self.staff_user)
        list_response = self.client.get("/api/orders/")
        self.assertEqual(list_response.status_code, 200)

        patch_response = self.client.patch(f"/api/orders/{order_id}/", {"status": "prepared"}, format="json")
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.data["status"], "prepared")

    @mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_valid_coupon_discounts_total_and_increments_usage(self, mock_post):
        coupon = Coupon.objects.create(code="PROMO10", discount_percent=10, max_uses=5, used_count=0)
        self.client.force_authenticate(user=self.regular_user)
        payload = {
            "full_name": "Jean Client",
            "phone": "+22990000000",
            "address": "Fidjrossè",
            "coupon_code": "promo10",
            "items": [{"product_id": self.product.id, "quantity": 5}],
        }
        response = self.client.post("/api/orders/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["discount_xof"], 1000)
        self.assertEqual(response.data["total_xof"], 9000)
        self.assertEqual(response.data["coupon_code"], "PROMO10")
        coupon.refresh_from_db()
        self.assertEqual(coupon.used_count, 1)

    def test_invalid_coupon_rejects_order_creation(self):
        self.client.force_authenticate(user=self.regular_user)
        payload = {
            "full_name": "Jean Client",
            "phone": "+22990000000",
            "address": "Fidjrossè",
            "coupon_code": "DOESNOTEXIST",
            "items": [{"product_id": self.product.id, "quantity": 1}],
        }
        response = self.client.post("/api/orders/", payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Order.objects.count(), 0)

    @mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_order_without_coupon_has_zero_discount(self, mock_post):
        self.client.force_authenticate(user=self.regular_user)
        payload = {
            "full_name": "Jean Client",
            "phone": "+22990000000",
            "address": "Fidjrossè",
            "items": [{"product_id": self.product.id, "quantity": 1}],
        }
        response = self.client.post("/api/orders/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["discount_xof"], 0)
        self.assertEqual(response.data["coupon_code"], "")
