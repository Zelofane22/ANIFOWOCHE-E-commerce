from unittest import mock

import requests
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APITestCase

from apps.core.factories import (
    CategoryFactory,
    OrderFactory,
    OrderItemFactory,
    ProductFactory,
    SellerProfileFactory,
    ShopFactory,
    SuperUserFactory,
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
            "phone": "+2290190000000",
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
        seller = SellerProfileFactory(user=user, display_name="Owner", phone="+2290190000000")
        ShopFactory(seller=seller, name="Afi Wax", whatsapp_phone="+2290190000000")

        response = self.client.post(
            "/api/seller/register/",
            {
                "username": "vendeuse",
                "password": "StrongPass123!",
                "password2": "StrongPass123!",
                "display_name": "Afi Boutique",
                "phone": "+2290191000000",
                "shop_name": "Afi Wax",
                "shop_slug": "afi-wax",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(User.objects.count(), 1)

    def test_authenticated_seller_can_read_and_update_profile(self):
        user = UserFactory(username="vendeuse")
        seller = SellerProfileFactory(user=user, display_name="Afi Boutique", phone="+2290190000000")
        ShopFactory(seller=seller, name="Afi Wax", whatsapp_phone="+2290190000000")
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

    def test_seller_profile_update_accepts_unchanged_shop_slug(self):
        user = UserFactory(username="vendeuse")
        seller = SellerProfileFactory(user=user, display_name="Afi Boutique", phone="+2290190000000")
        ShopFactory(seller=seller, name="Afi Wax", whatsapp_phone="+2290190000000")
        self.client.force_authenticate(user=user)

        patch_response = self.client.patch(
            "/api/seller/profile/",
            {
                "display_name": "Afi Seller",
                "shop": {"name": "Afi Wax", "slug": "afi-wax", "city": "Cotonou"},
            },
            format="json",
        )

        self.assertEqual(patch_response.status_code, 200)
        seller.refresh_from_db()
        seller.shop.refresh_from_db()
        self.assertEqual(seller.display_name, "Afi Seller")
        self.assertEqual(seller.shop.slug, "afi-wax")

    def test_seller_profile_update_rejects_slug_taken_by_other_shop(self):
        user = UserFactory(username="vendeuse")
        seller = SellerProfileFactory(user=user, display_name="Afi Boutique", phone="+2290190000000")
        ShopFactory(seller=seller, name="Afi Wax", whatsapp_phone="+2290190000000")
        other_user = UserFactory(username="autre")
        other_seller = SellerProfileFactory(user=other_user, display_name="Autre", phone="+2290191000000")
        ShopFactory(seller=other_seller, name="Mode Elite", whatsapp_phone="+2290191000000")
        self.client.force_authenticate(user=user)

        patch_response = self.client.patch(
            "/api/seller/profile/",
            {"shop": {"name": "Afi Wax", "slug": "mode-elite"}},
            format="json",
        )

        self.assertEqual(patch_response.status_code, 400)
        self.assertIn("slug", patch_response.data["shop"])

    def test_shop_slug_availability_endpoint(self):
        user = UserFactory(username="vendeuse")
        seller = SellerProfileFactory(user=user, display_name="Afi Boutique", phone="+2290190000000")
        ShopFactory(seller=seller, name="Afi Wax", whatsapp_phone="+2290190000000")
        other_user = UserFactory(username="autre")
        other_seller = SellerProfileFactory(user=other_user, display_name="Autre", phone="+2290191000000")
        ShopFactory(seller=other_seller, name="Mode Elite", whatsapp_phone="+2290191000000")
        self.client.force_authenticate(user=user)

        own = self.client.get("/api/seller/shop/slug-availability/", {"slug": "afi-wax"})
        self.assertEqual(own.status_code, 200)
        self.assertTrue(own.data["available"])

        taken = self.client.get("/api/seller/shop/slug-availability/", {"slug": "mode-elite"})
        self.assertEqual(taken.status_code, 200)
        self.assertFalse(taken.data["available"])

        free = self.client.get("/api/seller/shop/slug-availability/", {"slug": "nouvelle-boutique"})
        self.assertEqual(free.status_code, 200)
        self.assertTrue(free.data["available"])

        self.client.force_authenticate(user=None)
        anonymous = self.client.get("/api/seller/shop/slug-availability/", {"slug": "afi-wax"})
        self.assertEqual(anonymous.status_code, 401)

    def test_public_shop_is_available_by_slug(self):
        user = UserFactory(username="vendeuse")
        seller = SellerProfileFactory(user=user, display_name="Afi Boutique", phone="+2290190000000")
        ShopFactory(
            seller=seller,
            name="Afi Wax",
            whatsapp_phone="+2290190000000",
            city="Cotonou",
        )

        response = self.client.get("/api/public/shops/afi-wax/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["name"], "Afi Wax")

    def test_public_shop_returns_only_active_seller_products(self):
        category = CategoryFactory(name="Tissus", slug="tissus")
        user = UserFactory(username="vendeuse")
        seller = SellerProfileFactory(user=user, display_name="Afi Boutique", phone="+2290190000000")
        ShopFactory(seller=seller, name="Afi Wax", whatsapp_phone="+2290190000000")
        other_user = UserFactory(username="autre")
        other_seller = SellerProfileFactory(user=other_user, display_name="Autre", phone="+2290191000000")
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
        seller = SellerProfileFactory(user=user, display_name="Afi Boutique", phone="+2290190000000")
        ShopFactory(seller=seller, name="Afi Wax", whatsapp_phone="+2290190000000")
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
            phone="+2290191111111",
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
        seller = SellerProfileFactory(user=seller_user, display_name="Afi Boutique", phone="+2290190000000")
        ShopFactory(seller=seller, name="Afi Wax", whatsapp_phone="+2290190000000")
        product = ProductFactory(
            seller=seller,
            category=category,
            name="Pagne",
            slug="pagne",
            price_xof=5000,
            stock=5,
        )
        other_user = UserFactory(username="autre")
        other_seller = SellerProfileFactory(user=other_user, display_name="Autre Boutique", phone="+2290191000000")
        ShopFactory(seller=other_seller, name="Autre Shop", whatsapp_phone="+2290191000000")
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
            phone="+2290191111111",
            email="client@example.com",
            address="Rue des Cocotiers",
            city="Cotonou",
            status=Order.Status.RECEIVED,
        )
        OrderItemFactory(order=order, product=product, quantity=1, unit_price_xof=5000)

        other_order = OrderFactory(
            customer=customer,
            full_name="Mme Autre",
            phone="+2290192222222",
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
        seller = SellerProfileFactory(user=seller_user, display_name="Afi Boutique", phone="+2290190000000")
        ShopFactory(seller=seller, name="Afi Wax", whatsapp_phone="+2290190000000")
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
            phone="+2290191111111",
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
        seller = SellerProfileFactory(user=seller_user, display_name="Afi Boutique", phone="+2290190000000")
        ShopFactory(seller=seller, name="Afi Wax", whatsapp_phone="+2290190000000")
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
            phone="+2290191111111",
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
        seller = SellerProfileFactory(user=seller_user, display_name="Afi Boutique", phone="+2290190000000")
        ShopFactory(seller=seller, name="Afi Wax", whatsapp_phone="+2290190000000")
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
            phone="+2290191111111",
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
        seller = SellerProfileFactory(user=seller_user, display_name="Afi Boutique", phone="+2290190000000")
        ShopFactory(seller=seller, name="Afi Wax", whatsapp_phone="+2290190000000")
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
            phone="+2290191111111",
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
        seller = SellerProfileFactory(user=seller_user, display_name="Afi Boutique", phone="+2290190000000")
        ShopFactory(seller=seller, name="Afi Wax", whatsapp_phone="+2290190000000")
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
            phone="+2290191111111",
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


class SellerAdminTests(TestCase):
    def setUp(self):
        self.admin = SuperUserFactory(username="seller-admin")
        self.client.force_login(self.admin)

    def test_sellerprofile_changelist(self):
        response = self.client.get("/admin/sellers/sellerprofile/")
        self.assertEqual(response.status_code, 200)

    def test_sellerprofile_add_form_readonly(self):
        # Lecture seule : le bouton « Ajouter » ne doit plus exister.
        response = self.client.get("/admin/sellers/sellerprofile/add/")
        self.assertEqual(response.status_code, 403)

    def test_sellerprofile_change_readonly(self):
        # Détail toujours consultable, mais sans bouton Enregistrer/Supprimer.
        profile = SellerProfileFactory()
        response = self.client.get(f"/admin/sellers/sellerprofile/{profile.pk}/change/")
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, 'name="_save"')

    def test_shop_changelist(self):
        response = self.client.get("/admin/sellers/shop/")
        self.assertEqual(response.status_code, 200)

    def test_shop_add_form_readonly(self):
        # Lecture seule : le bouton « Ajouter » ne doit plus exister.
        response = self.client.get("/admin/sellers/shop/add/")
        self.assertEqual(response.status_code, 403)

    def test_shop_change_readonly(self):
        # Détail toujours consultable, mais sans bouton Enregistrer/Supprimer.
        shop = ShopFactory()
        response = self.client.get(f"/admin/sellers/shop/{shop.pk}/change/")
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, 'name="_save"')

    def test_non_staff_cannot_access(self):
        user = UserFactory(username="regular-seller")
        self.client.force_login(user)
        response = self.client.get("/admin/sellers/shop/")
        self.assertEqual(response.status_code, 302)


class SellerPlanLimitsTests(APITestCase):
    """Limites du plan gratuit : 5 produits actifs, 5 commandes/mois, vitrine principale."""

    def setUp(self):
        self.category = CategoryFactory(name="Tissus", slug="tissus")
        self.user = UserFactory(username="vendeuse")
        self.seller = SellerProfileFactory(user=self.user, display_name="Afi Boutique", phone="+2290190000000")
        self.shop = ShopFactory(seller=self.seller, name="Afi Wax", slug="afi-wax", whatsapp_phone="+2290190000000")
        self.client.force_authenticate(user=self.user)

    def _create_product_via_api(self, name="Pagne"):
        return self.client.post(
            "/api/seller/products/",
            {
                "name": name,
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

    def _create_orders_for_seller(self, count, status=Order.Status.RECEIVED):
        product = ProductFactory(seller=self.seller, category=self.category)
        for _ in range(count):
            order = OrderFactory(status=status)
            OrderItemFactory(order=order, product=product, quantity=1)
        return product

    # --- Attribution du plan à l'inscription ---------------------------------

    def test_register_assigns_free_plan_and_hides_shop_from_main_store(self):
        self.client.force_authenticate(user=None)
        payload = {
            "username": "nouveau",
            "password": "StrongPass123!",
            "password2": "StrongPass123!",
            "display_name": "Nouvelle Boutique",
            "phone": "+2290195000000",
            "shop_name": "Nouvelle Shop",
            "shop_slug": "nouvelle-shop",
        }

        response = self.client.post("/api/seller/register/", payload, format="json")

        self.assertEqual(response.status_code, 201)
        seller = SellerProfile.objects.get(user__username="nouveau")
        self.assertEqual(seller.plan, SellerProfile.Plan.FREE)
        self.assertFalse(seller.shop.visible_on_main_store)

    # --- Limite produits -------------------------------------------------------

    def test_free_seller_blocked_at_sixth_active_product(self):
        ProductFactory.create_batch(5, seller=self.seller, category=self.category)

        response = self._create_product_via_api()

        self.assertEqual(response.status_code, 400)
        self.assertIn("5 produits actifs", str(response.data))

    def test_archived_products_do_not_count_toward_limit(self):
        products = ProductFactory.create_batch(5, seller=self.seller, category=self.category)
        products[0].is_active = False
        products[0].save(update_fields=["is_active"])

        response = self._create_product_via_api()

        self.assertEqual(response.status_code, 201)

    def test_reactivation_blocked_at_limit(self):
        products = ProductFactory.create_batch(6, seller=self.seller, category=self.category)
        archived = products[0]
        archived.is_active = False
        archived.save(update_fields=["is_active"])

        response = self.client.patch(
            f"/api/seller/products/{archived.slug}/",
            {"is_active": True},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        archived.refresh_from_db()
        self.assertFalse(archived.is_active)

    def test_paid_seller_can_exceed_product_limit(self):
        self.seller.plan = SellerProfile.Plan.PRO
        self.seller.save(update_fields=["plan"])
        ProductFactory.create_batch(10, seller=self.seller, category=self.category)

        response = self._create_product_via_api()

        self.assertEqual(response.status_code, 201)

    # --- Quota mensuel de commandes -------------------------------------------

    def test_free_shop_hidden_when_monthly_order_quota_reached(self):
        self._create_orders_for_seller(5)

        response = self.client.get("/api/public/shops/afi-wax/")

        self.assertEqual(response.status_code, 404)

    def test_free_shop_visible_below_monthly_quota(self):
        self._create_orders_for_seller(4)

        response = self.client.get("/api/public/shops/afi-wax/")

        self.assertEqual(response.status_code, 200)

    def test_cancelled_orders_do_not_count_toward_quota(self):
        self._create_orders_for_seller(5, status=Order.Status.CANCELLED)

        response = self.client.get("/api/public/shops/afi-wax/")

        self.assertEqual(response.status_code, 200)

    def test_paid_shop_not_hidden_by_quota(self):
        self.seller.plan = SellerProfile.Plan.PRO
        self.seller.save(update_fields=["plan"])
        self._create_orders_for_seller(5)

        response = self.client.get("/api/public/shops/afi-wax/")

        self.assertEqual(response.status_code, 200)

    def test_order_rejected_when_seller_quota_reached(self):
        product = self._create_orders_for_seller(5)
        self.client.force_authenticate(user=None)

        response = self.client.post(
            "/api/orders/",
            {
                "full_name": "Client Test",
                "phone": "+2290196000000",
                "address": "Cotonou",
                "items": [{"product_id": product.id, "quantity": 1}],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("limite de commandes", str(response.data))

    def test_public_shop_product_detail_hidden_when_quota_reached(self):
        product = self._create_orders_for_seller(5)

        response = self.client.get(f"/api/public/shops/afi-wax/products/{product.slug}/")

        self.assertEqual(response.status_code, 404)

    # --- Exemption de la boutique entreprise -----------------------------------

    def test_main_store_shop_exempt_from_free_limits(self):
        self.shop.slug = "ets-anifowoche"
        self.shop.visible_on_main_store = True
        self.shop.save()
        product = self._create_orders_for_seller(5)

        shop_response = self.client.get("/api/public/shops/ets-anifowoche/")
        catalog_response = self.client.get("/api/products/")

        self.assertEqual(shop_response.status_code, 200)
        slugs = [item["slug"] for item in catalog_response.data["results"]]
        self.assertIn(product.slug, slugs)

    # --- Dashboard : bloc limits ----------------------------------------------

    def test_dashboard_exposes_free_plan_limits(self):
        ProductFactory.create_batch(3, seller=self.seller, category=self.category)
        self._create_orders_for_seller(2)

        response = self.client.get("/api/seller/dashboard/")

        self.assertEqual(response.status_code, 200)
        limits = response.data["seller"]["limits"]
        self.assertEqual(limits["plan"], "FREE")
        self.assertEqual(limits["max_products"], 5)
        self.assertEqual(limits["max_orders_per_month"], 5)
        self.assertEqual(limits["products_used"], 4)  # 3 + produit des commandes
        self.assertEqual(limits["orders_this_month"], 2)
        self.assertTrue(limits["public_shop_visible"])
        self.assertFalse(limits["can_appear_on_main_store"])

    # --- Matrice des fonctionnalités par offre --------------------------------

    def test_dashboard_exposes_features_matrix_for_free(self):
        response = self.client.get("/api/seller/dashboard/")

        self.assertEqual(response.status_code, 200)
        features = response.data["seller"]["limits"]["features"]
        self.assertFalse(features["basic_customization"])
        self.assertFalse(features["advanced_customization"])
        self.assertFalse(features["essential_stats"])
        self.assertFalse(features["advanced_stats"])
        self.assertFalse(features["exports"])
        self.assertFalse(features["team"])
        self.assertFalse(features["promotions"])
        self.assertFalse(features["client_relaunch"])
        self.assertFalse(features["custom_domain"])
        self.assertFalse(features["online_payment"])
        self.assertFalse(features["multi_store"])
        self.assertFalse(features["priority_support"])

    def test_starter_plan_features(self):
        self.seller.plan = SellerProfile.Plan.STARTER
        self.seller.save(update_fields=["plan"])

        response = self.client.get("/api/seller/dashboard/")

        self.assertEqual(response.status_code, 200)
        features = response.data["seller"]["limits"]["features"]
        self.assertTrue(features["basic_customization"])
        self.assertTrue(features["essential_stats"])
        self.assertTrue(features["online_payment"])
        self.assertFalse(features["advanced_stats"])
        self.assertFalse(features["exports"])
        self.assertFalse(features["team"])
        self.assertFalse(features["promotions"])
        self.assertFalse(features["client_relaunch"])
        self.assertFalse(features["custom_domain"])

    def test_pro_plan_features(self):
        self.seller.plan = SellerProfile.Plan.PRO
        self.seller.save(update_fields=["plan"])

        response = self.client.get("/api/seller/dashboard/")

        self.assertEqual(response.status_code, 200)
        features = response.data["seller"]["limits"]["features"]
        for feature in (
            "basic_customization",
            "advanced_customization",
            "essential_stats",
            "advanced_stats",
            "exports",
            "team",
            "promotions",
            "client_relaunch",
            "custom_domain",
            "online_payment",
        ):
            self.assertTrue(features[feature], feature)
        self.assertFalse(features["multi_store"])
        self.assertFalse(features["priority_support"])

    def test_business_plan_features(self):
        self.seller.plan = SellerProfile.Plan.BUSINESS
        self.seller.save(update_fields=["plan"])

        response = self.client.get("/api/seller/dashboard/")

        self.assertEqual(response.status_code, 200)
        features = response.data["seller"]["limits"]["features"]
        self.assertTrue(features["multi_store"])
        self.assertTrue(features["priority_support"])
        self.assertTrue(features["advanced_stats"])
        self.assertTrue(features["exports"])

    def test_main_store_exempt_from_feature_limits(self):
        self.shop.slug = "ets-anifowoche"
        self.shop.save()

        response = self.client.get("/api/seller/dashboard/")

        self.assertEqual(response.status_code, 200)
        features = response.data["seller"]["limits"]["features"]
        self.assertTrue(features["advanced_stats"])
        self.assertTrue(features["priority_support"])
        self.assertTrue(features["multi_store"])
