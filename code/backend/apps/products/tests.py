from io import BytesIO

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
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
            user=self.free_user, display_name="Free Shop", phone="+2290190000001"
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
            user=self.paid_user, display_name="Paid Shop", phone="+2290190000002", plan="PAID"
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

    def test_free_seller_product_hidden_from_public_list(self):
        # Les produits d'un vendeur FREE tiers n'apparaissent pas sur le catalogue
        # principal ; ils restent visibles sur sa boutique publique.
        response = self.client.get("/api/products/")
        slugs = [item["slug"] for item in response.data["results"]]
        self.assertNotIn("produit-gratuit", slugs)

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
        slugs = []
        url = "/api/products/categories/"
        while url:
            response = self.client.get(url)
            self.assertEqual(response.status_code, 200)
            slugs.extend(item["slug"] for item in response.data["results"])
            url = response.data.get("next")
        self.assertIn("tissus", slugs)

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

    def test_in_stock_filter_includes_made_to_order_products(self):
        ProductFactory(
            category=self.category,
            name="Crêpes",
            slug="crepes",
            price_xof=3000,
            stock=0,
            made_to_order=True,
        )

        response = self.client.get("/api/products/", {"stock__gt": 0})
        slugs = [item["slug"] for item in response.data["results"]]

        self.assertEqual(slugs, ["pagne-wax", "crepes"])

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

    def test_regular_product_reports_stock_availability(self):
        response = self.client.get("/api/products/pagne-wax/")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["made_to_order"])
        self.assertTrue(response.data["in_stock"])

        ruptured = ProductFactory(
            category=self.category, name="Rupture", slug="rupture", price_xof=2000, stock=0
        )
        response_ruptured = self.client.get(f"/api/products/{ruptured.slug}/")
        self.assertFalse(response_ruptured.data["in_stock"])

    def test_made_to_order_product_is_in_stock_with_zero_stock(self):
        restauration = CategoryFactory(name="Restauration", slug="restauration")
        dish = ProductFactory(
            category=restauration,
            name="Crêpes au miel",
            slug="crepes-au-miel",
            price_xof=1500,
            stock=0,
            made_to_order=True,
        )
        response = self.client.get(f"/api/products/{dish.slug}/")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["made_to_order"])
        self.assertTrue(response.data["in_stock"])

    def test_in_stock_filter_includes_made_to_order_products(self):
        restauration = CategoryFactory(name="Restauration", slug="restauration")
        ProductFactory(
            category=restauration,
            name="Crêpes",
            slug="crepes",
            price_xof=1500,
            stock=0,
            made_to_order=True,
        )
        ProductFactory(
            category=self.category, name="Rupture", slug="rupture", price_xof=2000, stock=0
        )
        response = self.client.get("/api/products/", {"in_stock": "1"})
        slugs = [item["slug"] for item in response.data["results"]]
        self.assertIn("crepes", slugs)
        self.assertIn("pagne-wax", slugs)
        self.assertNotIn("rupture", slugs)


class SellerProductApiTests(APITestCase):
    def setUp(self):
        self.category = CategoryFactory(name="Tissus", slug="tissus")
        self.user = UserFactory(username="vendeuse")
        self.seller = SellerProfileFactory(
            user=self.user,
            display_name="Afi Boutique",
            phone="+2290190000000",
        )
        ShopFactory(
            seller=self.seller,
            name="Afi Wax",
            whatsapp_phone="+2290190000000",
        )
        self.other_user = UserFactory(username="autre")
        self.other_seller = SellerProfileFactory(
            user=self.other_user,
            display_name="Autre Boutique",
            phone="+2290191000000",
        )
        ShopFactory(
            seller=self.other_seller,
            name="Autre Shop",
            whatsapp_phone="+2290191000000",
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

    def test_seller_restauration_product_is_auto_made_to_order(self):
        restauration = CategoryFactory(name="Restauration", slug="restauration")
        response = self.client.post(
            "/api/seller/products/",
            {
                "name": "Crêpes vendeur",
                "description": "Fait maison",
                "price_xof": 2500,
                "stock": 0,
                "category_id": restauration.id,
                "unit": "piece",
                "size": "UNIQUE",
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        from .models import Product

        product = Product.objects.get(slug="crepes-vendeur")
        self.assertTrue(product.made_to_order)
        self.assertTrue(response.data["made_to_order"])
        self.assertTrue(response.data["in_stock"])


from django.test import TestCase
from apps.core.factories import SuperUserFactory, CategoryFactory, ProductFactory, SellerProfileFactory, ShopFactory


class ProductAdminTests(TestCase):
    def setUp(self):
        self.admin = SuperUserFactory(username="product-admin")
        self.client.force_login(self.admin)

    def test_category_changelist(self):
        response = self.client.get("/admin/products/category/")
        self.assertEqual(response.status_code, 200)

    def test_category_add_form(self):
        response = self.client.get("/admin/products/category/add/")
        self.assertEqual(response.status_code, 200)

    def test_product_changelist(self):
        response = self.client.get("/admin/products/product/")
        self.assertEqual(response.status_code, 200)

    def test_product_add_form(self):
        response = self.client.get("/admin/products/product/add/")
        self.assertEqual(response.status_code, 200)

    def test_optiongroup_changelist(self):
        response = self.client.get("/admin/products/optiongroup/")
        self.assertEqual(response.status_code, 200)

    def test_optiongroup_add_form(self):
        response = self.client.get("/admin/products/optiongroup/add/")
        self.assertEqual(response.status_code, 200)

    def test_non_staff_cannot_access(self):
        from apps.core.factories import UserFactory
        user = UserFactory(username="regular-user")
        self.client.force_login(user)
        response = self.client.get("/admin/products/category/")
        self.assertEqual(response.status_code, 302)


from django.core.management import call_command
from django.db import IntegrityError
from django.test import SimpleTestCase

from apps.core.factories import SuperUserFactory

from .models import Category, Product
from .serializers import SellerProductSerializer


class CategoryTreeModelTests(APITestCase):
    """Tests du modèle Category en arbre à 3 niveaux."""

    def test_category_level_is_deduced_from_parent(self):
        root = CategoryFactory(name="Root", slug="root", level=1, parent=None)
        child = CategoryFactory(name="Child", slug="child", parent=root)
        leaf = CategoryFactory(name="Leaf", slug="leaf", parent=child)
        self.assertEqual(root.level, 1)
        self.assertEqual(child.level, 2)
        self.assertEqual(leaf.level, 3)

    def test_cannot_create_category_level_4(self):
        l1 = CategoryFactory(name="L1", slug="l1", level=1, parent=None)
        l2 = CategoryFactory(name="L2", slug="l2", parent=l1)
        l3 = CategoryFactory(name="L3", slug="l3", parent=l2)
        with self.assertRaises(ValidationError):
            Category(name="L4", slug="l4", parent=l3, level=4).full_clean()

    def test_parent_slug_unique_constraint(self):
        parent = CategoryFactory(name="Parent", slug="parent", level=1, parent=None)
        CategoryFactory(name="Child", slug="child", parent=parent)
        with self.assertRaises(IntegrityError):
            Category.objects.create(name="Other", slug="child", parent=parent, level=2)

    def test_root_slug_unique_constraint(self):
        CategoryFactory(name="Root", slug="unique-root", level=1, parent=None)
        with self.assertRaises(IntegrityError):
            Category.objects.create(name="Other", slug="unique-root", level=1)

    def test_product_clean_requires_level_3_category(self):
        l1 = CategoryFactory(name="L1", slug="l1-clean", level=1, parent=None)
        product = ProductFactory(category=l1)
        with self.assertRaises(ValidationError):
            product.full_clean()


class CategoryTreeApiTests(APITestCase):
    """Tests de l'endpoint public d'arbre et des permissions admin."""

    def setUp(self):
        self.root = CategoryFactory(name="Root", slug="root-tree", level=1, parent=None)
        self.child = CategoryFactory(name="Child", slug="child-tree", parent=self.root)
        self.leaf = CategoryFactory(name="Leaf", slug="leaf-tree", parent=self.child)
        self.inactive_child = CategoryFactory(
            name="Inactive", slug="inactive-tree", parent=self.root, is_active=False
        )

    def test_tree_endpoint_returns_nested_structure(self):
        response = self.client.get("/api/products/categories/tree/")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)
        root_data = next(item for item in response.data if item["slug"] == "root-tree")
        self.assertEqual(len(root_data["children"]), 1)
        self.assertEqual(root_data["children"][0]["slug"], "child-tree")
        self.assertEqual(root_data["children"][0]["children"][0]["slug"], "leaf-tree")

    def test_tree_endpoint_excludes_inactive_nodes(self):
        response = self.client.get("/api/products/categories/tree/")
        slugs = [c["slug"] for c in response.data[0]["children"]]
        self.assertNotIn("inactive-tree", slugs)

    def test_list_categories_only_returns_active_level3(self):
        response = self.client.get("/api/products/categories/")
        self.assertEqual(response.status_code, 200)
        for item in response.data["results"]:
            category = Category.objects.get(pk=item["id"])
            self.assertEqual(category.level, 3)
            self.assertTrue(category.is_active)
        # Notre feuille active est bien un type (niveau 3) exposable.
        self.assertTrue(
            Category.objects.filter(pk=self.leaf.id, level=3, is_active=True).exists()
        )

    def test_anonymous_cannot_create_category(self):
        response = self.client.post("/api/products/categories/", {"name": "Hack", "slug": "hack"})
        self.assertEqual(response.status_code, 401)

    def test_admin_can_create_category(self):
        admin = SuperUserFactory(username="category-admin")
        self.client.force_authenticate(user=admin)
        response = self.client.post(
            "/api/products/categories/",
            {"name": "Nouvelle", "slug": "nouvelle", "level": 1, "is_active": True},
        )
        self.assertEqual(response.status_code, 201)


class SeedCategoriesTests(APITestCase):
    """Tests de la commande de seed des catégories."""

    def test_seed_categories_is_idempotent(self):
        call_command("seed_categories")
        count_after_first = Category.objects.count()
        self.assertGreater(count_after_first, 0)
        call_command("seed_categories")
        self.assertEqual(Category.objects.count(), count_after_first)

    def test_seed_creates_restauration_leaf(self):
        call_command("seed_categories")
        restauration = Category.objects.get(slug="restauration")
        self.assertEqual(restauration.level, 3)
        self.assertEqual(restauration.parent.slug, "prepared-meals")
        self.assertEqual(restauration.parent.parent.slug, "food")


class CategoryTreeDefinitionTests(SimpleTestCase):
    """Garde-fous sur la définition statique de CATEGORY_TREE (sans base de données)."""

    def test_all_level3_slugs_are_globally_unique(self):
        from collections import Counter

        from apps.products.category_tree import CATEGORY_TREE, _walk

        slugs = [
            item["node"]["slug"]
            for root in CATEGORY_TREE
            for item in _walk(root, level=1)
            if item["level"] == 3
        ]
        duplicates = [slug for slug, count in Counter(slugs).items() if count > 1]
        self.assertEqual(duplicates, [], f"Slugs de niveau 3 dupliqués : {duplicates}")

    def test_get_leaf_paths_returns_real_level3_nodes(self):
        from apps.products.category_tree import get_leaf_paths

        paths = get_leaf_paths()
        self.assertEqual(len(paths), 93)
        for path in paths.values():
            self.assertEqual(len(path), 3)
        self.assertEqual(
            [step["slug"] for step in paths["restauration"]],
            ["food", "prepared-meals", "restauration"],
        )


class ProductCategoryLevelValidationTests(APITestCase):
    """Tests de la validation 'Product.category doit être de niveau 3'."""

    def setUp(self):
        self.seller_user = UserFactory(username="seller-validation")
        self.seller = SellerProfileFactory(user=self.seller_user)
        self.shop = ShopFactory(seller=self.seller)
        self.level1 = CategoryFactory(name="L1", slug="l1-validation", level=1, parent=None)
        self.level3 = CategoryFactory(name="L3", slug="l3-validation")

    def test_seller_product_serializer_rejects_level1_category(self):
        self.client.force_authenticate(user=self.seller_user)
        response = self.client.post(
            "/api/seller/products/",
            {
                "name": "Produit invalide",
                "description": "Test",
                "price_xof": 1000,
                "stock": 1,
                "category_id": self.level1.id,
                "unit": "piece",
                "size": "UNIQUE",
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("category_id", response.data)

    def test_seller_product_serializer_accepts_level3_category(self):
        self.client.force_authenticate(user=self.seller_user)
        response = self.client.post(
            "/api/seller/products/",
            {
                "name": "Produit valide",
                "description": "Test",
                "price_xof": 1000,
                "stock": 1,
                "category_id": self.level3.id,
                "unit": "piece",
                "size": "UNIQUE",
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
