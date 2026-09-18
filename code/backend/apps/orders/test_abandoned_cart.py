from datetime import timedelta
from unittest import mock

import requests
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.core.factories import (
    CategoryFactory,
    OrderFactory,
    ProductFactory,
    SellerProfileFactory,
    ShopFactory,
    UserFactory,
)
from apps.notifications.models import Notification
from apps.sellers.models import SellerProfile

from .models import AbandonedCart, Order
from .services import (
    estimated_total_xof,
    mark_abandoned_cart_converted,
    send_abandoned_cart_reminders,
    sync_abandoned_cart,
)


def make_product(**kwargs):
    category = CategoryFactory()
    defaults = dict(slug="pagne", name="Pagne", price_xof=2000, stock=10)
    defaults.update(kwargs)
    return ProductFactory(category=category, **defaults)


def make_cart(email="client@example.com", product=None, hours_ago=3, **kwargs):
    if product is None:
        product = make_product()
    cart = AbandonedCart.objects.create(
        email=email,
        items=[{
            "id": product.id,
            "slug": product.slug,
            "name": product.name,
            "image": "",
            "price_xof": product.price_xof,
            "quantity": 1,
            "color_name": "",
            "color_hex": "",
            "selected_options": [],
            "delivery_method": "delivery",
        }],
        **kwargs,
    )
    if hours_ago is not None:
        AbandonedCart.objects.filter(pk=cart.pk).update(
            updated_at=timezone.now() - timedelta(hours=hours_ago)
        )
        cart.refresh_from_db()
    return cart


def _resend_success():
    response = mock.Mock()
    response.raise_for_status.return_value = None
    response.json.return_value = {"id": "resend-id-abandoned"}
    return mock.patch("apps.notifications.services.requests.post", return_value=response)


def _resend_failure():
    return mock.patch(
        "apps.notifications.services.requests.post",
        side_effect=requests.exceptions.ConnectionError,
    )


class AbandonedCartServiceTests(TestCase):
    def test_create_abandoned_cart(self):
        product = make_product()
        cart = sync_abandoned_cart(
            email="Client@Example.com",
            items=[{"slug": product.slug, "quantity": 2}],
        )
        self.assertIsNotNone(cart)
        self.assertEqual(cart.email, "client@example.com")
        self.assertEqual(cart.status, AbandonedCart.Status.ACTIVE)
        self.assertTrue(cart.token)
        self.assertEqual(cart.items[0]["name"], product.name)
        self.assertEqual(cart.items[0]["price_xof"], product.price_xof)
        self.assertEqual(AbandonedCart.objects.count(), 1)

    def test_update_existing_abandoned_cart(self):
        product = make_product()
        first = sync_abandoned_cart(email="client@example.com", items=[{"slug": product.slug, "quantity": 1}])
        second = sync_abandoned_cart(email="client@example.com", items=[{"slug": product.slug, "quantity": 5}])
        self.assertEqual(first.pk, second.pk)
        self.assertEqual(AbandonedCart.objects.count(), 1)
        self.assertEqual(second.items[0]["quantity"], 5)

    def test_cart_without_email_is_ignored(self):
        product = make_product()
        cart = sync_abandoned_cart(email="", items=[{"slug": product.slug}])
        self.assertIsNone(cart)
        self.assertEqual(AbandonedCart.objects.count(), 0)

    def test_empty_cart_is_ignored(self):
        cart = sync_abandoned_cart(email="client@example.com", items=[])
        self.assertIsNone(cart)
        self.assertEqual(AbandonedCart.objects.count(), 0)

    def test_unavailable_product_is_filtered(self):
        product = make_product(is_active=False)
        cart = sync_abandoned_cart(email="client@example.com", items=[{"slug": product.slug}])
        self.assertIsNone(cart)

    def test_mark_converted_after_order_created(self):
        product = make_product()
        cart = sync_abandoned_cart(email="client@example.com", items=[{"slug": product.slug}])
        converted = mark_abandoned_cart_converted(email="client@example.com")
        self.assertEqual(converted, 1)
        cart.refresh_from_db()
        self.assertEqual(cart.status, AbandonedCart.Status.CONVERTED)

    def test_shop_isolation_between_sellers(self):
        seller_a = SellerProfileFactory(plan=SellerProfile.Plan.STARTER)
        shop_a = ShopFactory(seller=seller_a, name="Boutique A")
        product_a = make_product(seller=seller_a, shop=shop_a, slug="produit-a")

        seller_b = SellerProfileFactory(plan=SellerProfile.Plan.STARTER)
        shop_b = ShopFactory(seller=seller_b, name="Boutique B")
        product_b = make_product(seller=seller_b, shop=shop_b, slug="produit-b")

        cart_a = sync_abandoned_cart(email="client@example.com", items=[{"slug": product_a.slug}])
        cart_b = sync_abandoned_cart(email="client@example.com", items=[{"slug": product_b.slug}])

        self.assertEqual(cart_a.shop_id, shop_a.pk)
        self.assertEqual(cart_b.shop_id, shop_b.pk)
        self.assertEqual(AbandonedCart.objects.count(), 2)
        self.assertNotEqual(cart_a.pk, cart_b.pk)

    def test_estimated_total_includes_options(self):
        total = estimated_total_xof([
            {"price_xof": 2000, "quantity": 2, "selected_options": [{"price_xof": 500}]},
        ])
        self.assertEqual(total, 5000)


class AbandonedCartReminderTests(TestCase):
    def test_recent_cart_is_ignored(self):
        make_cart(hours_ago=1)
        with _resend_success():
            sent = send_abandoned_cart_reminders()
        self.assertEqual(sent, 0)
        self.assertFalse(Notification.objects.filter(event=Notification.Event.ABANDONED_CART).exists())

    def test_already_reminded_cart_is_ignored(self):
        cart = make_cart(hours_ago=5)
        cart.reminder_sent_at = timezone.now() - timedelta(hours=1)
        cart.save(update_fields=["reminder_sent_at"])
        with _resend_success():
            sent = send_abandoned_cart_reminders()
        self.assertEqual(sent, 0)
        self.assertFalse(Notification.objects.filter(event=Notification.Event.ABANDONED_CART).exists())

    def test_resend_success_sets_reminder_sent_at(self):
        cart = make_cart(hours_ago=5)
        with _resend_success():
            sent = send_abandoned_cart_reminders()
        self.assertEqual(sent, 1)
        cart.refresh_from_db()
        self.assertIsNotNone(cart.reminder_sent_at)
        self.assertIsNotNone(cart.abandoned_at)
        notification = Notification.objects.get(event=Notification.Event.ABANDONED_CART)
        self.assertEqual(notification.status, Notification.Status.SENT)

    def test_resend_failure_leaves_reminder_sent_at_empty(self):
        cart = make_cart(hours_ago=5)
        with _resend_failure():
            sent = send_abandoned_cart_reminders()
        self.assertEqual(sent, 0)
        cart.refresh_from_db()
        self.assertIsNone(cart.reminder_sent_at)
        notification = Notification.objects.get(event=Notification.Event.ABANDONED_CART)
        self.assertEqual(notification.status, Notification.Status.FAILED)

    def test_no_reminder_if_order_exists(self):
        cart = make_cart(email="client@example.com", hours_ago=5)
        OrderFactory(email="client@example.com", full_name="Client", phone="+2290190000000", total_xof=1000)
        with _resend_success():
            sent = send_abandoned_cart_reminders()
        self.assertEqual(sent, 0)
        cart.refresh_from_db()
        self.assertEqual(cart.status, AbandonedCart.Status.CONVERTED)
        self.assertFalse(Notification.objects.filter(event=Notification.Event.ABANDONED_CART).exists())

    def test_command_is_idempotent(self):
        make_cart(hours_ago=5)
        with _resend_success():
            first = send_abandoned_cart_reminders()
            second = send_abandoned_cart_reminders()
        self.assertEqual(first, 1)
        self.assertEqual(second, 0)
        self.assertEqual(Notification.objects.filter(event=Notification.Event.ABANDONED_CART).count(), 1)


class AbandonedCartApiTests(APITestCase):
    def test_sync_endpoint_creates_cart_and_returns_token(self):
        product = make_product()
        response = self.client.post(
            "/api/orders/abandoned-cart/",
            {"email": "client@example.com", "items": [{"slug": product.slug, "quantity": 1}]},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["token"])
        self.assertNotIn("email", response.data)
        self.assertEqual(AbandonedCart.objects.count(), 1)

    def test_sync_endpoint_rejects_empty_items(self):
        response = self.client.post(
            "/api/orders/abandoned-cart/",
            {"email": "client@example.com", "items": []},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(AbandonedCart.objects.count(), 0)

    def test_retrieve_by_valid_token(self):
        cart = make_cart(email="client@example.com", hours_ago=None)
        response = self.client.get(f"/api/orders/abandoned-cart/{cart.token}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["items"]), 1)
        self.assertNotIn("email", response.data)

    def test_retrieve_by_invalid_token_is_refused(self):
        response = self.client.get("/api/orders/abandoned-cart/not-a-real-token/")
        self.assertEqual(response.status_code, 404)

    def test_retrieve_converted_cart_is_refused(self):
        cart = make_cart(email="client@example.com", hours_ago=None, status=AbandonedCart.Status.CONVERTED)
        response = self.client.get(f"/api/orders/abandoned-cart/{cart.token}/")
        self.assertEqual(response.status_code, 404)

    @mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_order_creation_marks_cart_converted(self, mock_post):
        product = make_product()
        cart = sync_abandoned_cart(email="client@example.com", items=[{"slug": product.slug}])
        response = self.client.post(
            "/api/orders/",
            {
                "full_name": "Jean Client",
                "phone": "+2290190000000",
                "email": "client@example.com",
                "address": "Fidjrossè",
                "items": [{"product_id": product.id, "quantity": 1}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        cart.refresh_from_db()
        self.assertEqual(cart.status, AbandonedCart.Status.CONVERTED)
