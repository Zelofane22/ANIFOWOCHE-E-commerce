from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.orders.models import Order
from apps.products.models import Category, Product

from .models import ReturnRequest

User = get_user_model()


class ReturnRequestApiTests(APITestCase):
    def setUp(self):
        category = Category.objects.create(name="Tissus", slug="tissus")
        product = Product.objects.create(category=category, name="Pagne", slug="pagne", price_xof=2000, stock=10)
        self.owner = User.objects.create_user(username="owner", password="pass1234")
        self.other_user = User.objects.create_user(username="other", password="pass1234")
        self.staff_user = User.objects.create_user(username="admin", password="pass1234", is_staff=True)

        self.order = Order.objects.create(
            customer=self.owner, full_name="Owner", phone="+22990000000", address="Fidjrossè", total_xof=2000
        )
        self.other_order = Order.objects.create(
            customer=self.other_user, full_name="Other", phone="+22990000001", address="Akpakpa", total_xof=2000
        )
        self.product = product

    def test_owner_can_request_return_for_own_order(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(
            "/api/returns/", {"order_id": self.order.id, "reason": "Taille incorrecte"}, format="json"
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "requested")
        self.assertEqual(response.data["order"], self.order.id)
        self.assertEqual(ReturnRequest.objects.count(), 1)

    def test_cannot_request_return_for_someone_elses_order(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(
            "/api/returns/", {"order_id": self.other_order.id, "reason": "Pas la mienne"}, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(ReturnRequest.objects.count(), 0)

    def test_anonymous_cannot_create_return_request(self):
        response = self.client.post(
            "/api/returns/", {"order_id": self.order.id, "reason": "Test"}, format="json"
        )
        self.assertEqual(response.status_code, 401)

    def test_customer_sees_only_own_return_requests(self):
        ReturnRequest.objects.create(order=self.order, reason="Motif A")
        ReturnRequest.objects.create(order=self.other_order, reason="Motif B")

        self.client.force_authenticate(user=self.owner)
        response = self.client.get("/api/returns/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["order"], self.order.id)

    def test_staff_sees_all_return_requests(self):
        ReturnRequest.objects.create(order=self.order, reason="Motif A")
        ReturnRequest.objects.create(order=self.other_order, reason="Motif B")

        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get("/api/returns/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 2)

    def test_update_and_delete_are_not_exposed(self):
        return_request = ReturnRequest.objects.create(order=self.order, reason="Motif A")
        self.client.force_authenticate(user=self.staff_user)
        detail_url = f"/api/returns/{return_request.id}/"
        self.assertEqual(self.client.patch(detail_url, {"status": "approved"}, format="json").status_code, 405)
        self.assertEqual(self.client.delete(detail_url).status_code, 405)
