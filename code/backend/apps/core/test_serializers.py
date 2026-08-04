from django.test import TestCase

from apps.core.factories import (
    CategoryFactory,
    CouponFactory,
    OrderFactory,
    ProductFactory,
    SellerProfileFactory,
    ShopFactory,
    UserFactory,
)
from apps.orders.serializers import OrderSerializer
from apps.payments.models import Payment
from apps.payments.serializers import InitiatePaymentSerializer
from apps.products.serializers import ProductSerializer
from apps.sellers.serializers import SellerRegisterSerializer


class OrderSerializerValidationTests(TestCase):
    def setUp(self):
        self.product = ProductFactory(price_xof=1000, stock=10)

    def test_empty_items_rejected(self):
        serializer = OrderSerializer(data={
            "full_name": "Test",
            "phone": "+2290190000000",
            "address": "Cotonou",
            "items": [],
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn("items", serializer.errors)

    def test_valid_order_data(self):
        serializer = OrderSerializer(data={
            "full_name": "Jean",
            "phone": "+2290190000000",
            "address": "Cotonou",
            "items": [{"product_id": self.product.pk, "quantity": 1}],
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_missing_full_name(self):
        serializer = OrderSerializer(data={
            "phone": "+2290190000000",
            "address": "Cotonou",
            "items": [{"product_id": self.product.pk, "quantity": 1}],
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn("full_name", serializer.errors)

    def test_missing_phone(self):
        serializer = OrderSerializer(data={
            "full_name": "Jean",
            "address": "Cotonou",
            "items": [{"product_id": self.product.pk, "quantity": 1}],
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn("phone", serializer.errors)

    def test_valid_coupon_code(self):
        coupon = CouponFactory(code="TEST10", is_active=True, max_uses=5)
        serializer = OrderSerializer(data={
            "full_name": "Jean",
            "phone": "+2290190000000",
            "address": "Cotonou",
            "items": [{"product_id": self.product.pk, "quantity": 1}],
            "coupon_code": "TEST10",
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_invalid_coupon_code(self):
        serializer = OrderSerializer(data={
            "full_name": "Jean",
            "phone": "+2290190000000",
            "address": "Cotonou",
            "items": [{"product_id": self.product.pk, "quantity": 1}],
            "coupon_code": "NONEXISTENT",
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn("coupon_code", serializer.errors)

    def test_blank_coupon_code_is_valid(self):
        serializer = OrderSerializer(data={
            "full_name": "Jean",
            "phone": "+2290190000000",
            "address": "Cotonou",
            "items": [{"product_id": self.product.pk, "quantity": 1}],
            "coupon_code": "",
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)


class InitiatePaymentSerializerTests(TestCase):
    def setUp(self):
        self.order = OrderFactory()

    def test_valid_payment_initiation(self):
        serializer = InitiatePaymentSerializer(data={
            "order_id": self.order.pk,
            "method": "mtn",
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_invalid_method_rejected(self):
        serializer = InitiatePaymentSerializer(data={
            "order_id": self.order.pk,
            "method": "bitcoin",
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn("method", serializer.errors)

    def test_missing_order_id(self):
        serializer = InitiatePaymentSerializer(data={
            "method": "mtn",
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn("order_id", serializer.errors)

    def test_missing_method(self):
        serializer = InitiatePaymentSerializer(data={
            "order_id": self.order.pk,
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn("method", serializer.errors)

    def test_all_valid_methods(self):
        for method in ["mtn", "moov", "card", "cash_on_delivery"]:
            serializer = InitiatePaymentSerializer(data={
                "order_id": self.order.pk,
                "method": method,
            })
            self.assertTrue(serializer.is_valid(), f"Method {method} should be valid")


class SellerRegisterSerializerTests(TestCase):
    def _valid_data(self, **overrides):
        data = {
            "username": "newseller",
            "password": "Str0ngP@ss!",
            "password2": "Str0ngP@ss!",
            "display_name": "Mon Shop",
            "phone": "+2290190000000",
            "shop_name": "Boutique Tissus",
        }
        data.update(overrides)
        return data

    def test_valid_registration(self):
        serializer = SellerRegisterSerializer(data=self._valid_data())
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_password_mismatch(self):
        serializer = SellerRegisterSerializer(data=self._valid_data(password2="different"))
        self.assertFalse(serializer.is_valid())
        self.assertIn("password2", serializer.errors)

    def test_duplicate_username(self):
        UserFactory(username="taken")
        serializer = SellerRegisterSerializer(data=self._valid_data(username="taken"))
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)

    def test_missing_display_name(self):
        data = self._valid_data()
        del data["display_name"]
        serializer = SellerRegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("display_name", serializer.errors)

    def test_missing_phone(self):
        data = self._valid_data()
        del data["phone"]
        serializer = SellerRegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("phone", serializer.errors)

    def test_missing_shop_name(self):
        data = self._valid_data()
        del data["shop_name"]
        serializer = SellerRegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("shop_name", serializer.errors)

    def test_optional_email(self):
        serializer = SellerRegisterSerializer(data=self._valid_data(email="seller@test.com"))
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_optional_fields_accepted(self):
        data = self._valid_data(city="Porto-Novo", shop_slug="mon-shop", shop_description="Desc")
        serializer = SellerRegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)


class ProductSerializerValidationTests(TestCase):
    def setUp(self):
        self.category = CategoryFactory()

    def test_valid_product(self):
        serializer = ProductSerializer(data={
            "name": "Pagne Bazin",
            "category_id": self.category.pk,
            "price_xof": 5000,
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_missing_name(self):
        serializer = ProductSerializer(data={
            "category_id": self.category.pk,
            "price_xof": 5000,
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn("name", serializer.errors)

    def test_missing_category_id(self):
        serializer = ProductSerializer(data={
            "name": "Pagne",
            "price_xof": 5000,
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn("category_id", serializer.errors)

    def test_missing_price_xof(self):
        serializer = ProductSerializer(data={
            "name": "Pagne",
            "category_id": self.category.pk,
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn("price_xof", serializer.errors)
