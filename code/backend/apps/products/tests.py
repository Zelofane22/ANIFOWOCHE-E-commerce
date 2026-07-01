from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import Category, Product

User = get_user_model()


class ProductApiTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Tissus", slug="tissus")
        self.product = Product.objects.create(
            category=self.category,
            name="Pagne wax",
            slug="pagne-wax",
            price_xof=5000,
            stock=10,
        )
        self.inactive_product = Product.objects.create(
            category=self.category,
            name="Ancien modèle",
            slug="ancien-modele",
            price_xof=3000,
            stock=0,
            is_active=False,
        )

    def test_list_products_only_returns_active(self):
        response = self.client.get("/api/products/")
        self.assertEqual(response.status_code, 200)
        slugs = [item["slug"] for item in response.data["results"]]
        self.assertIn("pagne-wax", slugs)
        self.assertNotIn("ancien-modele", slugs)

    def test_retrieve_product_by_slug(self):
        response = self.client.get("/api/products/pagne-wax/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["price_xof"], 5000)

    def test_list_categories(self):
        response = self.client.get("/api/products/categories/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"][0]["slug"], "tissus")

    def test_search_by_name(self):
        response = self.client.get("/api/products/", {"search": "wax"})
        self.assertEqual(len(response.data["results"]), 1)
