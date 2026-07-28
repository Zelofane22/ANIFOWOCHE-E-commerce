from datetime import timedelta

from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase
from django.utils import timezone

from apps.core.factories import (
    CategoryFactory,
    CouponFactory,
    OrderFactory,
    OrderItemFactory,
    ProductFactory,
    ReviewFactory,
    SellerProfileFactory,
    ShopFactory,
    UserFactory,
    WishlistItemFactory,
)
from apps.orders.models import Order
from apps.products.models import Product
from apps.sellers.models import Shop


class OrderReferenceTests(TestCase):
    def test_reference_with_pk(self):
        order = OrderFactory()
        self.assertEqual(order.reference, f"CMD-{order.pk:06d}")

    def test_reference_without_pk(self):
        order = Order()
        self.assertEqual(order.reference, "\u2014")


class OrderRecomputeTotalTests(TestCase):
    def test_recompute_total_sums_items(self):
        order = OrderFactory(total_xof=0)
        OrderItemFactory(order=order, quantity=2, unit_price_xof=1000)
        OrderItemFactory(order=order, quantity=1, unit_price_xof=3000)
        order.recompute_total()
        order.refresh_from_db()
        self.assertEqual(order.total_xof, 5000)

    def test_recompute_total_with_no_items(self):
        order = OrderFactory(total_xof=999)
        order.recompute_total()
        order.refresh_from_db()
        self.assertEqual(order.total_xof, 0)

    def test_recompute_total_with_options(self):
        order = OrderFactory(total_xof=0)
        OrderItemFactory(
            order=order,
            quantity=2,
            unit_price_xof=1000,
            selected_options=[{"price_xof": 500}],
        )
        order.recompute_total()
        order.refresh_from_db()
        self.assertEqual(order.total_xof, 3000)


class OrderCancelTests(TestCase):
    def test_cancel_received_order(self):
        order = OrderFactory(status=Order.Status.RECEIVED)
        product = ProductFactory(stock=10)
        OrderItemFactory(order=order, product=product, quantity=3)

        order.cancel(reason="Client annule")

        order.refresh_from_db()
        product.refresh_from_db()
        self.assertEqual(order.status, Order.Status.CANCELLED)
        self.assertEqual(order.cancellation_reason, "Client annule")
        self.assertIsNotNone(order.cancelled_at)
        self.assertEqual(product.stock, 13)

    def test_cancel_prepared_order(self):
        order = OrderFactory(status=Order.Status.PREPARED)
        product = ProductFactory(stock=5)
        OrderItemFactory(order=order, product=product, quantity=2)

        order.cancel()

        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.CANCELLED)
        product.refresh_from_db()
        self.assertEqual(product.stock, 7)

    def test_cancel_delivered_order_raises(self):
        order = OrderFactory(status=Order.Status.DELIVERED)
        with self.assertRaises(ValidationError):
            order.cancel()

    def test_cancel_cancelled_order_raises(self):
        order = OrderFactory(status=Order.Status.CANCELLED)
        with self.assertRaises(ValidationError):
            order.cancel()

    def test_cancel_restores_color_stock(self):
        order = OrderFactory(status=Order.Status.RECEIVED)
        product = ProductFactory(stock=10)
        product.colors = [{"name": "Rouge", "hex": "#FF0000", "stock": 5}]
        product.save()
        OrderItemFactory(order=order, product=product, quantity=2, color_name="Rouge")

        order.cancel()

        product.refresh_from_db()
        self.assertEqual(product.colors[0]["stock"], 7)


class OrderItemSubtotalTests(TestCase):
    def test_subtotal_without_options(self):
        item = OrderItemFactory(quantity=3, unit_price_xof=1000)
        self.assertEqual(item.subtotal_xof, 3000)

    def test_subtotal_with_options(self):
        item = OrderItemFactory(
            quantity=2,
            unit_price_xof=1000,
            selected_options=[{"price_xof": 300}, {"price_xof": 200}],
        )
        self.assertEqual(item.subtotal_xof, 3000)

    def test_subtotal_empty_options(self):
        item = OrderItemFactory(quantity=1, unit_price_xof=5000, selected_options=[])
        self.assertEqual(item.subtotal_xof, 5000)


class ProductSlugTests(TestCase):
    def test_auto_slug_generation(self):
        product = ProductFactory(name="Ma Super Tunique", slug="")
        self.assertEqual(product.slug, "ma-super-tunique")

    def test_slug_uniqueness(self):
        ProductFactory(name="Pagne Bazin", slug="pagne-bazin")
        product2 = ProductFactory(name="Pagne Bazin", slug="")
        self.assertEqual(product2.slug, "pagne-bazin-2")

    def test_metre_unit_forces_unique_size(self):
        product = ProductFactory(unit="metre", size="M")
        product.save()
        product.refresh_from_db()
        self.assertEqual(product.size, "UNIQUE")

    def test_piece_unit_keeps_size(self):
        product = ProductFactory(unit="piece", size="L")
        product.save()
        self.assertEqual(product.size, "L")

    def test_build_unique_slug_fallback(self):
        slug = Product._build_unique_slug("")
        self.assertEqual(slug, "produit")

    def test_build_unique_slug_truncation(self):
        long_name = "A" * 200
        slug = Product._build_unique_slug(long_name)
        self.assertLessEqual(len(slug), 160)


class ShopSlugTests(TestCase):
    def test_auto_slug_generation(self):
        seller = SellerProfileFactory()
        shop = ShopFactory(seller=seller, name="Ma Boutique", slug="")
        self.assertEqual(shop.slug, "ma-boutique")

    def test_slug_uniqueness(self):
        seller1 = SellerProfileFactory()
        seller2 = SellerProfileFactory()
        ShopFactory(seller=seller1, name="Boutique Tissus", slug="boutique-tissus")
        shop2 = ShopFactory(seller=seller2, name="Boutique Tissus", slug="")
        self.assertEqual(shop2.slug, "boutique-tissus-2")

    def test_public_path(self):
        shop = ShopFactory(slug="mon-shop")
        self.assertEqual(shop.public_path, "/shop/mon-shop")

    def test_build_unique_slug_fallback(self):
        slug = Shop._build_unique_slug("")
        self.assertEqual(slug, "boutique")


class CouponValidityTests(TestCase):
    def test_valid_coupon(self):
        coupon = CouponFactory(is_active=True, expires_at=timezone.now() + timedelta(days=10), used_count=0, max_uses=5)
        self.assertTrue(coupon.is_valid())

    def test_inactive_coupon(self):
        coupon = CouponFactory(is_active=False)
        self.assertFalse(coupon.is_valid())

    def test_expired_coupon(self):
        coupon = CouponFactory(is_active=True, expires_at=timezone.now() - timedelta(days=1))
        self.assertFalse(coupon.is_valid())

    def test_fully_used_coupon(self):
        coupon = CouponFactory(is_active=True, expires_at=timezone.now() + timedelta(days=10), used_count=5, max_uses=5)
        self.assertFalse(coupon.is_valid())

    def test_coupon_no_expiry_is_valid(self):
        coupon = CouponFactory(is_active=True, expires_at=None, used_count=0, max_uses=1)
        self.assertTrue(coupon.is_valid())


class ReviewRatingTests(TestCase):
    def test_valid_rating(self):
        review = ReviewFactory(rating=3)
        review.full_clean()

    def test_rating_too_low(self):
        review = ReviewFactory(rating=0)
        with self.assertRaises(ValidationError):
            review.full_clean()

    def test_rating_too_high(self):
        review = ReviewFactory(rating=6)
        with self.assertRaises(ValidationError):
            review.full_clean()

    def test_rating_negative(self):
        with self.assertRaises(IntegrityError):
            ReviewFactory(rating=-1)

    def test_rating_boundaries(self):
        for rating in [1, 5]:
            review = ReviewFactory(rating=rating)
            review.full_clean()


class WishlistUniqueConstraintTests(TestCase):
    def test_duplicate_wishlist_item_raises(self):
        user = UserFactory()
        product = ProductFactory()
        WishlistItemFactory(user=user, product=product)
        with self.assertRaises(IntegrityError):
            WishlistItemFactory(user=user, product=product)

    def test_different_users_same_product_ok(self):
        product = ProductFactory()
        user1 = UserFactory()
        user2 = UserFactory()
        WishlistItemFactory(user=user1, product=product)
        WishlistItemFactory(user=user2, product=product)
        self.assertEqual(2, WishlistItemFactory._meta.model.objects.count())
