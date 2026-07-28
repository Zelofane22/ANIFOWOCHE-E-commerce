from io import BytesIO

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework.test import APITestCase

from apps.core.factories import (
    CategoryFactory,
    ProductFactory,
    ProductImageFactory,
    SellerProfileFactory,
    ShopFactory,
    UserFactory,
)

from .models import ProductImage

User = get_user_model()


class PublicProductVisibilityTests(APITestCase):
    def setUp(self):
        self.category = CategoryFactory(name="Tissus", slug="tissus")
        self.company_product = ProductFactory(
            category=self.category,
            name="Produit entreprise",
            slug="produit-entreprise",
            price_xof=5000,
            stock=10,
        )
        self.free_user = UserFactory(username="free_vendeur")
        self.free_seller = SellerProfileFactory(
            user=self.free_user, display_name="Free Shop", phone="+22990000001"
        )
        self.free_product = ProductFactory(
            seller=self.free_seller,
            category=self.category,
            name="Produit gratuit",
            slug="produit-gratuit",
            price_xof=3000,
            stock=5,
        )
        self.paid_user = UserFactory(username="paid_vendeur")
        self.paid_seller = SellerProfileFactory(
            user=self.paid_user, display_name="Paid Shop", phone="+22990000002", plan="paid"
        )
        self.paid_product = ProductFactory(
            seller=self.paid_seller,
            category=self.category,
            name="Produit payant",
            slug="produit-payant",
            price_xof=8000,
            stock=5,
        )

    def test_company_product_visible_in_public_list(self):
        response = self.client.get("/api/products/")
        slugs = [item["slug"] for item in response.data["results"]]
        self.assertIn("produit-entreprise", slugs)

    def test_free_seller_product_visible_in_public_list(self):
        response = self.client.get("/api/products/")
        slugs = [item["slug"] for item in response.data["results"]]
        self.assertIn("produit-gratuit", slugs)

    def test_paid_seller_product_visible_in_public_list(self):
        response = self.client.get("/api/products/")
        slugs = [item["slug"] for item in response.data["results"]]
        self.assertIn("produit-payant", slugs)

    def test_free_seller_product_accessible_in_seller_own_api(self):
        self.client.force_authenticate(user=self.free_user)
        response = self.client.get("/api/seller/products/")
        slugs = [item["slug"] for item in response.data["results"]]
        self.assertIn("produit-gratuit", slugs)


class ProductApiTests(APITestCase):
    def setUp(self):
        self.category = CategoryFactory(name="Tissus", slug="tissus")
        self.product = ProductFactory(
            category=self.category,
            name="Pagne wax",
            slug="pagne-wax",
            price_xof=5000,
            stock=10,
        )
        self.inactive_product = ProductFactory(
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
        other_category = CategoryFactory(name="Vêtements", slug="vetements")
        ProductFactory(
            category=other_category, name="Chemise", slug="chemise", price_xof=4000, stock=5
        )
        response = self.client.get("/api/products/", {"category__slug": "tissus"})
        slugs = [item["slug"] for item in response.data["results"]]
        self.assertEqual(slugs, ["pagne-wax"])

    def test_filter_by_unit(self):
        ProductFactory(
            category=self.category, name="Bazin 3m", slug="bazin-3m", price_xof=9000, stock=5, unit="metre"
        )
        response = self.client.get("/api/products/", {"unit": "metre"})
        slugs = [item["slug"] for item in response.data["results"]]
        self.assertEqual(slugs, ["bazin-3m"])

    def test_filter_by_price_range(self):
        ProductFactory(
            category=self.category, name="Produit cher", slug="produit-cher", price_xof=50000, stock=5
        )
        response = self.client.get("/api/products/", {"price_xof__gte": 4000, "price_xof__lte": 6000})
        slugs = [item["slug"] for item in response.data["results"]]
        self.assertEqual(slugs, ["pagne-wax"])

    def test_filter_in_stock_only(self):
        ProductFactory(
            category=self.category, name="Rupture", slug="rupture", price_xof=2000, stock=0
        )
        response = self.client.get("/api/products/", {"stock__gt": 0})
        slugs = [item["slug"] for item in response.data["results"]]
        self.assertEqual(slugs, ["pagne-wax"])

    def test_ordering_by_price(self):
        ProductFactory(
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


class SellerProductApiTests(APITestCase):
    def setUp(self):
        self.category = CategoryFactory(name="Tissus", slug="tissus")
        self.user = UserFactory(username="vendeuse")
        self.seller = SellerProfileFactory(
            user=self.user,
            display_name="Afi Boutique",
            phone="+22990000000",
        )
        ShopFactory(
            seller=self.seller,
            name="Afi Wax",
            whatsapp_phone="+22990000000",
        )
        self.other_user = UserFactory(username="autre")
        self.other_seller = SellerProfileFactory(
            user=self.other_user,
            display_name="Autre Boutique",
            phone="+22991000000",
        )
        ShopFactory(
            seller=self.other_seller,
            name="Autre Shop",
            whatsapp_phone="+22991000000",
        )
        self.client.force_authenticate(user=self.user)

    def test_seller_can_create_product_with_core_catalog_fields(self):
        response = self.client.post(
            "/api/seller/products/",
            {
                "name": "Pagne vendeur",
                "description": "Wax premium",
                "price_xof": 7000,
                "stock": 8,
                "category_id": self.category.id,
                "unit": "piece",
                "size": "UNIQUE",
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        from .models import Product

        product = Product.objects.get(slug="pagne-vendeur")
        self.assertEqual(product.seller, self.seller)
        self.assertEqual(response.data["category"]["slug"], "tissus")

    def test_seller_products_are_scoped_to_authenticated_seller(self):
        ProductFactory(
            seller=self.seller,
            category=self.category,
            name="Produit Afi",
            slug="produit-afi",
            price_xof=5000,
            stock=4,
        )
        ProductFactory(
            seller=self.other_seller,
            category=self.category,
            name="Produit autre",
            slug="produit-autre",
            price_xof=6000,
            stock=4,
        )

        response = self.client.get("/api/seller/products/")

        self.assertEqual(response.status_code, 200)
        slugs = [item["slug"] for item in response.data["results"]]
        self.assertEqual(slugs, ["produit-afi"])

    def test_seller_can_update_own_product(self):
        product = ProductFactory(
            seller=self.seller,
            category=self.category,
            name="Pagne",
            slug="pagne",
            price_xof=5000,
            stock=3,
        )

        response = self.client.patch(
            f"/api/seller/products/{product.slug}/",
            {"price_xof": 6500, "stock": 12},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        product.refresh_from_db()
        self.assertEqual(product.price_xof, 6500)
        self.assertEqual(product.stock, 12)

    def test_seller_delete_archives_product(self):
        product = ProductFactory(
            seller=self.seller,
            category=self.category,
            name="Ancien pagne",
            slug="ancien-pagne",
            price_xof=5000,
            stock=3,
        )

        response = self.client.delete(f"/api/seller/products/{product.slug}/")

        self.assertEqual(response.status_code, 204)
        product.refresh_from_db()
        self.assertFalse(product.is_active)

    def test_seller_can_assign_product_to_its_shop(self):
        response = self.client.post(
            "/api/seller/products/",
            {
                "name": "Pagne boutique",
                "description": "Produit associé au shop",
                "price_xof": 8000,
                "stock": 4,
                "category_id": self.category.id,
                "shop_id": self.seller.shop.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        from .models import Product

        product = Product.objects.get(slug="pagne-boutique")
        self.assertEqual(product.shop, self.seller.shop)

    def test_seller_can_manage_product_gallery_images(self):
        product = ProductFactory(
            seller=self.seller,
            shop=self.seller.shop,
            category=self.category,
            name="Produit avec galerie",
            slug="produit-avec-galerie",
            price_xof=4500,
            stock=2,
        )

        buffer = BytesIO()
        Image.new("RGB", (1, 1), color="white").save(buffer, format="PNG")
        buffer.seek(0)
        image = SimpleUploadedFile("cover.png", buffer.read(), content_type="image/png")

        create_response = self.client.post(
            f"/api/seller/products/{product.slug}/images/",
            {"image": image, "alt_text": "Photo couverture", "order": 1, "is_cover": True},
            format="multipart",
        )

        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(create_response.data["alt_text"], "Photo couverture")
        image_id = create_response.data["id"]

        update_response = self.client.patch(
            f"/api/seller/products/{product.slug}/images/{image_id}/",
            {"alt_text": "Nouvelle légende", "is_cover": False},
            format="json",
        )

        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.data["alt_text"], "Nouvelle légende")

        delete_response = self.client.delete(f"/api/seller/products/{product.slug}/images/{image_id}/")
        self.assertEqual(delete_response.status_code, 204)
