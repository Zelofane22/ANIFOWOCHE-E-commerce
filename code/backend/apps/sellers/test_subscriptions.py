"""Tests du flux d'abonnement vendeur (pipeline E9, sandbox FedaPay).

Couvre : création d'abonnement (checkout), webhook FedaPay (approbation,
refus, signature, montant), idempotence, expiration/rétrogradation, endpoint
public des plans et statistiques avancées du dashboard.
"""
import hashlib
import hmac
import json
import time
from datetime import timedelta
from unittest import mock

import requests
from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.core.factories import (
    CategoryFactory,
    OrderFactory,
    OrderItemFactory,
    ProductFactory,
    SellerProfileFactory,
    ShopFactory,
    UserFactory,
)
from apps.orders.models import Order

from .models import SellerProfile, SellerSubscription

User = get_user_model()

WEBHOOK_SECRET = "test_webhook_secret"


def _sign(body: str, secret: str, timestamp=None) -> str:
    if timestamp is None:
        timestamp = str(int(time.time()))
    signed_payload = f"{timestamp}.{body}".encode()
    signature = hmac.new(secret.encode(), signed_payload, hashlib.sha256).hexdigest()
    return f"t={timestamp},s={signature}"


def _fedapay_success_mock():
    transaction_response = mock.Mock()
    transaction_response.json.return_value = {"v1/transaction": {"id": 42}}
    transaction_response.raise_for_status.return_value = None
    token_response = mock.Mock()
    token_response.json.return_value = {"url": "https://sandbox-pay.fedapay.com/t/42"}
    token_response.raise_for_status.return_value = None
    return mock.patch(
        "apps.payments.services.requests.post",
        side_effect=[transaction_response, token_response],
    )


class SellerSubscriptionFlowTests(APITestCase):
    def setUp(self):
        self.user = UserFactory(username="vendeuse")
        self.seller = SellerProfileFactory(user=self.user, display_name="Afi Boutique", phone="+2290190000000")
        ShopFactory(seller=self.seller, name="Afi Wax", whatsapp_phone="+2290190000000")
        self.client.force_authenticate(user=self.user)

    def test_create_subscription_returns_payment_link(self):
        with _fedapay_success_mock():
            response = self.client.post(
                "/api/seller/subscription/", {"plan": "STARTER"}, format="json"
            )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["plan"], SellerProfile.Plan.STARTER)
        self.assertEqual(response.data["status"], SellerSubscription.Status.PENDING)
        self.assertEqual(response.data["amount_xof"], 2000)
        self.assertEqual(response.data["fedapay_transaction_id"], "42")
        self.assertEqual(response.data["payment_url"], "https://sandbox-pay.fedapay.com/t/42")

    def test_starter_uses_launch_price_for_first_three_months(self):
        # Trois premiers mois à 2 000 F (abonnements APPROVED), puis 5 000 F.
        for _ in range(3):
            with _fedapay_success_mock():
                response = self.client.post(
                    "/api/seller/subscription/", {"plan": "STARTER"}, format="json"
                )
            self.assertEqual(response.status_code, 201)
            self.assertEqual(response.data["amount_xof"], 2000)
            sub = SellerSubscription.objects.get(id=response.data["id"])
            sub.status = SellerSubscription.Status.APPROVED
            sub.save(update_fields=["status"])

        with _fedapay_success_mock():
            response = self.client.post(
                "/api/seller/subscription/", {"plan": "STARTER"}, format="json"
            )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["amount_xof"], 5000)

    def test_create_subscription_rejects_free_plan(self):
        response = self.client.post("/api/seller/subscription/", {"plan": "FREE"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(SellerSubscription.objects.count(), 0)

    def test_create_subscription_rejects_unknown_plan(self):
        response = self.client.post("/api/seller/subscription/", {"plan": "ULTRA"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(SellerSubscription.objects.count(), 0)

    def test_create_subscription_marks_failed_on_fedapay_error(self):
        with mock.patch(
            "apps.payments.services.requests.post",
            side_effect=requests.exceptions.ConnectionError,
        ):
            response = self.client.post(
                "/api/seller/subscription/", {"plan": "PRO"}, format="json"
            )

        self.assertEqual(response.status_code, 400)
        subscription = SellerSubscription.objects.get(seller=self.seller)
        self.assertEqual(subscription.status, SellerSubscription.Status.FAILED)

    def test_get_subscription_returns_latest_and_plan(self):
        with _fedapay_success_mock():
            self.client.post("/api/seller/subscription/", {"plan": "STARTER"}, format="json")

        response = self.client.get("/api/seller/subscription/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["current_plan"], SellerProfile.Plan.FREE)
        self.assertEqual(response.data["subscription"]["plan"], SellerProfile.Plan.STARTER)
        self.assertIn("limits", response.data)

    @override_settings(FEDAPAY_WEBHOOK_SECRET=WEBHOOK_SECRET)
    def test_webhook_approves_subscription_and_switches_plan(self):
        subscription = SellerSubscription.objects.create(
            seller=self.seller,
            plan=SellerProfile.Plan.STARTER,
            amount_xof=5000,
            fedapay_transaction_id="777",
        )
        body = json.dumps({"name": "transaction.approved", "entity": {"id": "777", "amount": 5000}})
        signature = _sign(body, WEBHOOK_SECRET)

        response = self.client.post(
            "/api/payments/webhook/",
            data=body,
            content_type="application/json",
            HTTP_X_FEDAPAY_SIGNATURE=signature,
        )

        self.assertEqual(response.status_code, 200)
        subscription.refresh_from_db()
        self.assertEqual(subscription.status, SellerSubscription.Status.APPROVED)
        self.assertIsNotNone(subscription.starts_at)
        self.assertIsNotNone(subscription.ends_at)
        self.seller.refresh_from_db()
        self.assertEqual(self.seller.plan, SellerProfile.Plan.STARTER)

    @override_settings(FEDAPAY_WEBHOOK_SECRET=WEBHOOK_SECRET)
    def test_webhook_is_idempotent(self):
        subscription = SellerSubscription.objects.create(
            seller=self.seller,
            plan=SellerProfile.Plan.STARTER,
            amount_xof=5000,
            fedapay_transaction_id="777",
        )
        body = json.dumps({"name": "transaction.approved", "entity": {"id": "777", "amount": 5000}})
        signature = _sign(body, WEBHOOK_SECRET)

        for _ in range(2):
            response = self.client.post(
                "/api/payments/webhook/",
                data=body,
                content_type="application/json",
                HTTP_X_FEDAPAY_SIGNATURE=signature,
            )
            self.assertEqual(response.status_code, 200)

        subscription.refresh_from_db()
        self.assertEqual(subscription.status, SellerSubscription.Status.APPROVED)
        self.seller.refresh_from_db()
        self.assertEqual(self.seller.plan, SellerProfile.Plan.STARTER)
        self.assertEqual(SellerSubscription.objects.filter(seller=self.seller).count(), 1)

    @override_settings(FEDAPAY_WEBHOOK_SECRET=WEBHOOK_SECRET)
    def test_webhook_rejects_invalid_signature(self):
        SellerSubscription.objects.create(
            seller=self.seller,
            plan=SellerProfile.Plan.STARTER,
            amount_xof=5000,
            fedapay_transaction_id="777",
        )
        body = json.dumps({"name": "transaction.approved", "entity": {"id": "777", "amount": 5000}})
        response = self.client.post(
            "/api/payments/webhook/",
            data=body,
            content_type="application/json",
            HTTP_X_FEDAPAY_SIGNATURE="t=1,s=invalide",
        )
        self.assertEqual(response.status_code, 401)
        self.seller.refresh_from_db()
        self.assertEqual(self.seller.plan, SellerProfile.Plan.FREE)

    @override_settings(FEDAPAY_WEBHOOK_SECRET=WEBHOOK_SECRET)
    def test_webhook_rejects_amount_mismatch(self):
        SellerSubscription.objects.create(
            seller=self.seller,
            plan=SellerProfile.Plan.STARTER,
            amount_xof=5000,
            fedapay_transaction_id="777",
        )
        body = json.dumps({"name": "transaction.approved", "entity": {"id": "777", "amount": 9000}})
        signature = _sign(body, WEBHOOK_SECRET)

        response = self.client.post(
            "/api/payments/webhook/",
            data=body,
            content_type="application/json",
            HTTP_X_FEDAPAY_SIGNATURE=signature,
        )

        self.assertEqual(response.status_code, 400)
        subscription = SellerSubscription.objects.get(seller=self.seller)
        self.assertEqual(subscription.status, SellerSubscription.Status.PENDING)

    @override_settings(FEDAPAY_WEBHOOK_SECRET=WEBHOOK_SECRET)
    def test_webhook_declined_keeps_free_plan(self):
        subscription = SellerSubscription.objects.create(
            seller=self.seller,
            plan=SellerProfile.Plan.STARTER,
            amount_xof=5000,
            fedapay_transaction_id="777",
        )
        body = json.dumps({"name": "transaction.declined", "entity": {"id": "777", "amount": 5000}})
        signature = _sign(body, WEBHOOK_SECRET)

        response = self.client.post(
            "/api/payments/webhook/",
            data=body,
            content_type="application/json",
            HTTP_X_FEDAPAY_SIGNATURE=signature,
        )

        self.assertEqual(response.status_code, 200)
        subscription.refresh_from_db()
        self.assertEqual(subscription.status, SellerSubscription.Status.DECLINED)
        self.seller.refresh_from_db()
        self.assertEqual(self.seller.plan, SellerProfile.Plan.FREE)

    @override_settings(FEDAPAY_WEBHOOK_SECRET=WEBHOOK_SECRET)
    def test_webhook_unknown_transaction_returns_404(self):
        body = json.dumps({"name": "transaction.approved", "entity": {"id": "nope", "amount": 5000}})
        signature = _sign(body, WEBHOOK_SECRET)
        response = self.client.post(
            "/api/payments/webhook/",
            data=body,
            content_type="application/json",
            HTTP_X_FEDAPAY_SIGNATURE=signature,
        )
        self.assertEqual(response.status_code, 404)

    def test_expire_subscriptions_downgrades_to_free(self):
        subscription = SellerSubscription.objects.create(
            seller=self.seller,
            plan=SellerProfile.Plan.PRO,
            amount_xof=10000,
            status=SellerSubscription.Status.APPROVED,
            starts_at=timezone.now() - timedelta(days=60),
            ends_at=timezone.now() - timedelta(days=30),
        )
        self.seller.plan = SellerProfile.Plan.PRO
        self.seller.save(update_fields=["plan"])

        from .services import expire_subscriptions
        downgraded = expire_subscriptions()

        self.assertEqual(downgraded, 1)
        self.seller.refresh_from_db()
        self.assertEqual(self.seller.plan, SellerProfile.Plan.FREE)
        subscription.refresh_from_db()
        self.assertEqual(subscription.status, SellerSubscription.Status.APPROVED)


class SellerPlansAndDashboardTests(APITestCase):
    def setUp(self):
        self.user = UserFactory(username="vendeuse")
        self.seller = SellerProfileFactory(user=self.user, display_name="Afi Boutique", phone="+2290190000000")
        ShopFactory(seller=self.seller, name="Afi Wax", whatsapp_phone="+2290190000000")
        self.client.force_authenticate(user=self.user)

    def test_public_plans_endpoint_lists_plans_with_prices(self):
        response = self.client.get("/api/public/plans/")

        self.assertEqual(response.status_code, 200)
        codes = {plan["code"] for plan in response.data["plans"]}
        self.assertEqual(codes, {"FREE", "STARTER", "PRO", "BUSINESS"})
        prices = {plan["code"]: plan["price_xof"] for plan in response.data["plans"]}
        self.assertEqual(prices["FREE"], 0)
        self.assertEqual(prices["STARTER"], 5000)
        self.assertEqual(prices["PRO"], 10000)
        self.assertIn("features", response.data["plans"][0])

    def test_dashboard_includes_advanced_stats(self):
        category = CategoryFactory(name="Tissus", slug="tissus")
        product = ProductFactory(
            seller=self.seller, category=category, name="Pagne", slug="pagne", price_xof=5000, stock=5
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
            total_xof=10000,
        )
        OrderItemFactory(order=order, product=product, quantity=2, unit_price_xof=5000)

        cancelled = OrderFactory(
            customer=customer,
            full_name="Mme Autre",
            phone="+2290192222222",
            email="autre@example.com",
            address="Rue des Palmiers",
            city="Porto-Novo",
            status=Order.Status.CANCELLED,
            total_xof=5000,
        )
        OrderItemFactory(order=cancelled, product=product, quantity=1, unit_price_xof=5000)

        response = self.client.get("/api/seller/dashboard/")

        self.assertEqual(response.status_code, 200)
        kpi = response.data["kpi"]
        self.assertEqual(kpi["avg_order_value"], 10000)
        self.assertEqual(kpi["conversion_rate"], 50.0)
