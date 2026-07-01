from unittest import mock

import requests
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.products.models import Category, Product

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

    def test_create_order_requires_at_least_one_item(self):
        payload = {"full_name": "Jean", "phone": "+22990000000", "address": "Fidjrossè", "items": []}
        response = self.client.post("/api/orders/", payload, format="json")
        self.assertEqual(response.status_code, 400)

    @mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_anonymous_cannot_list_orders(self, mock_post):
        self.client.post(
            "/api/orders/",
            {
                "full_name": "Jean",
                "phone": "+22990000000",
                "address": "Fidjrossè",
                "items": [{"product_id": self.product.id, "quantity": 1}],
            },
            format="json",
        )
        response = self.client.get("/api/orders/")
        self.assertEqual(response.status_code, 401)

    @mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_non_staff_cannot_list_orders(self, mock_post):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/orders/")
        self.assertEqual(response.status_code, 403)

    @mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_staff_can_list_and_update_order_status(self, mock_post):
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
