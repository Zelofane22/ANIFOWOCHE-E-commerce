from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.products.models import Category, Product

from .models import WishlistItem

User = get_user_model()


class WishlistApiTests(APITestCase):
    def setUp(self):
        category = Category.objects.create(name="Tissus", slug="tissus")
        self.product = Product.objects.create(
            category=category, name="Pagne", slug="pagne", price_xof=2000, stock=10
        )
        self.other_product = Product.objects.create(
            category=category, name="Bazin", slug="bazin", price_xof=3000, stock=5
        )
        self.owner = User.objects.create_user(username="owner", password="pass1234")
        self.other_user = User.objects.create_user(username="other", password="pass1234")

    def test_authenticated_user_can_add_product_to_wishlist(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post("/api/wishlist/", {"product_id": self.product.id}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["product"]["slug"], "pagne")
        self.assertEqual(WishlistItem.objects.count(), 1)

    def test_adding_same_product_twice_is_idempotent(self):
        self.client.force_authenticate(user=self.owner)
        self.client.post("/api/wishlist/", {"product_id": self.product.id}, format="json")
        response = self.client.post("/api/wishlist/", {"product_id": self.product.id}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(WishlistItem.objects.filter(user=self.owner, product=self.product).count(), 1)

    def test_anonymous_cannot_add_to_wishlist(self):
        response = self.client.post("/api/wishlist/", {"product_id": self.product.id}, format="json")
        self.assertEqual(response.status_code, 401)

    def test_user_sees_only_own_wishlist(self):
        WishlistItem.objects.create(user=self.owner, product=self.product)
        WishlistItem.objects.create(user=self.other_user, product=self.other_product)

        self.client.force_authenticate(user=self.owner)
        response = self.client.get("/api/wishlist/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["product"]["slug"], "pagne")

    def test_user_can_remove_product_from_wishlist_by_product_id(self):
        WishlistItem.objects.create(user=self.owner, product=self.product)
        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(f"/api/wishlist/{self.product.id}/")
        self.assertEqual(response.status_code, 204)
        self.assertEqual(WishlistItem.objects.count(), 0)

    def test_user_cannot_remove_another_users_wishlist_item(self):
        WishlistItem.objects.create(user=self.other_user, product=self.other_product)
        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(f"/api/wishlist/{self.other_product.id}/")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(WishlistItem.objects.count(), 1)
