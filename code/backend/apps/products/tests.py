from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import Category, Product, ProductImage

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

    def test_filter_by_category_slug(self):
        other_category = Category.objects.create(name="Vêtements", slug="vetements")
        Product.objects.create(
            category=other_category, name="Chemise", slug="chemise", price_xof=4000, stock=5
        )
        response = self.client.get("/api/products/", {"category__slug": "tissus"})
        slugs = [item["slug"] for item in response.data["results"]]
        self.assertEqual(slugs, ["pagne-wax"])

    def test_filter_by_unit(self):
        Product.objects.create(
            category=self.category, name="Bazin 3m", slug="bazin-3m", price_xof=9000, stock=5, unit="metre"
        )
        response = self.client.get("/api/products/", {"unit": "metre"})
        slugs = [item["slug"] for item in response.data["results"]]
        self.assertEqual(slugs, ["bazin-3m"])

    def test_filter_by_price_range(self):
        Product.objects.create(
            category=self.category, name="Produit cher", slug="produit-cher", price_xof=50000, stock=5
        )
        response = self.client.get("/api/products/", {"price_xof__gte": 4000, "price_xof__lte": 6000})
        slugs = [item["slug"] for item in response.data["results"]]
        self.assertEqual(slugs, ["pagne-wax"])

    def test_filter_in_stock_only(self):
        Product.objects.create(
            category=self.category, name="Rupture", slug="rupture", price_xof=2000, stock=0
        )
        response = self.client.get("/api/products/", {"stock__gt": 0})
        slugs = [item["slug"] for item in response.data["results"]]
        self.assertEqual(slugs, ["pagne-wax"])

    def test_ordering_by_price(self):
        Product.objects.create(
            category=self.category, name="Moins cher", slug="moins-cher", price_xof=1000, stock=5
        )
        response = self.client.get("/api/products/", {"ordering": "price_xof"})
        slugs = [item["slug"] for item in response.data["results"]]
        self.assertEqual(slugs, ["moins-cher", "pagne-wax"])

        response_desc = self.client.get("/api/products/", {"ordering": "-price_xof"})
        slugs_desc = [item["slug"] for item in response_desc.data["results"]]
        self.assertEqual(slugs_desc, ["pagne-wax", "moins-cher"])

    def test_product_exposes_gallery_images_in_order(self):
        ProductImage.objects.create(product=self.product, image="products/gallery/b.jpg", order=2)
        ProductImage.objects.create(product=self.product, image="products/gallery/a.jpg", order=1)

        response = self.client.get("/api/products/pagne-wax/")
        self.assertEqual(response.status_code, 200)
        images = response.data["images"]
        self.assertEqual(len(images), 2)
        self.assertTrue(images[0]["image"].endswith("a.jpg"))
        self.assertTrue(images[1]["image"].endswith("b.jpg"))

    def test_product_without_gallery_images_has_empty_list(self):
        response = self.client.get("/api/products/pagne-wax/")
        self.assertEqual(response.data["images"], [])
