from datetime import timedelta

from django.utils import timezone
from rest_framework.test import APITestCase

from apps.products.models import Category, Product

from .models import Coupon, Promotion


class ValidateCouponApiTests(APITestCase):
    def setUp(self):
        self.now = timezone.now()
        self.valid_coupon = Coupon.objects.create(code="WELCOME10", discount_percent=10, max_uses=5, used_count=1)
        self.expired_coupon = Coupon.objects.create(
            code="EXPIRED", discount_percent=20, expires_at=self.now - timedelta(days=1)
        )
        self.exhausted_coupon = Coupon.objects.create(
            code="EXHAUSTED", discount_percent=15, max_uses=1, used_count=1
        )
        self.inactive_coupon = Coupon.objects.create(code="OFF", discount_percent=5, is_active=False)

    def test_valid_coupon_is_accepted_case_insensitively(self):
        response = self.client.post("/api/promotions/coupons/validate/", {"code": "welcome10"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["discount_percent"], 10)

    def test_expired_coupon_is_rejected(self):
        response = self.client.post("/api/promotions/coupons/validate/", {"code": "EXPIRED"}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_exhausted_coupon_is_rejected(self):
        response = self.client.post("/api/promotions/coupons/validate/", {"code": "EXHAUSTED"}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_inactive_coupon_is_rejected(self):
        response = self.client.post("/api/promotions/coupons/validate/", {"code": "OFF"}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_unknown_coupon_is_rejected(self):
        response = self.client.post("/api/promotions/coupons/validate/", {"code": "DOESNOTEXIST"}, format="json")
        self.assertEqual(response.status_code, 400)


class ProductDiscountAnnotationTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Tissus", slug="tissus")
        self.direct_product = Product.objects.create(
            category=self.category, name="Bazin riche", slug="bazin-riche", price_xof=10000, stock=5
        )
        self.category_product = Product.objects.create(
            category=self.category, name="Wax collection", slug="wax-collection", price_xof=8000, stock=5
        )
        self.other_category = Category.objects.create(name="Vêtements", slug="vetements")
        self.untouched_product = Product.objects.create(
            category=self.other_category, name="Chemise unie", slug="chemise-unie", price_xof=5000, stock=5
        )
        now = timezone.now()
        active_on_product = Promotion.objects.create(
            name="Promo Bazin",
            discount_percent=20,
            is_active=True,
            starts_at=now - timedelta(days=1),
            ends_at=now + timedelta(days=1),
        )
        active_on_product.products.add(self.direct_product)

        active_on_category = Promotion.objects.create(
            name="Promo Tissus",
            discount_percent=10,
            is_active=True,
            starts_at=now - timedelta(days=1),
            ends_at=now + timedelta(days=1),
        )
        active_on_category.categories.add(self.category)

        expired = Promotion.objects.create(
            name="Promo expirée",
            discount_percent=50,
            is_active=True,
            starts_at=now - timedelta(days=10),
            ends_at=now - timedelta(days=5),
        )
        expired.products.add(self.untouched_product)

    def test_product_directly_targeted_gets_highest_applicable_discount(self):
        response = self.client.get("/api/products/bazin-riche/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["discount_percent"], 20)
        self.assertEqual(response.data["discounted_price_xof"], 8000)

    def test_product_covered_only_by_category_promotion_gets_it(self):
        response = self.client.get("/api/products/wax-collection/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["discount_percent"], 10)
        self.assertEqual(response.data["discounted_price_xof"], 7200)

    def test_expired_promotion_does_not_apply(self):
        response = self.client.get("/api/products/chemise-unie/")
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.data["discount_percent"])
        self.assertIsNone(response.data["discounted_price_xof"])
