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

    @mock.patch("apps.notifications.services._render_email_html", return_value="<html></html>")
    @mock.patch("apps.notifications.services.ResendClient")
    def test_expire_subscriptions_sends_downgrade_email_once(self, mock_resend_cls, _mock_html):
        mock_client = mock.Mock()
        mock_client.send_email.return_value = "msg_123"
        mock_resend_cls.return_value = mock_client

        self.user.email = "vendeuse@test.com"
        self.user.save(update_fields=["email"])

        subscription = SellerSubscription.objects.create(
            seller=self.seller,
            plan=SellerProfile.Plan.PRO,
            amount_xof=10000,
            status=SellerSubscription.Status.APPROVED,
            starts_at=timezone.now() - timedelta(days=60),
            ends_at=timezone.now() - timedelta(days=1),
        )
        self.seller.plan = SellerProfile.Plan.PRO
        self.seller.save(update_fields=["plan"])

        from apps.notifications.models import Notification
        from .services import expire_subscriptions

        downgraded = expire_subscriptions()

        self.assertEqual(downgraded, 1)
        self.assertEqual(
            Notification.objects.filter(event=Notification.Event.SUBSCRIPTION_DOWNGRADED).count(), 1
        )

        downgraded2 = expire_subscriptions()
        self.assertEqual(downgraded2, 0)
        self.assertEqual(
            Notification.objects.filter(event=Notification.Event.SUBSCRIPTION_DOWNGRADED).count(), 1
        )

    @mock.patch("apps.notifications.services._render_email_html", return_value="<html></html>")
    @mock.patch("apps.notifications.services.ResendClient")
    def test_remind_expiring_subscriptions_sends_and_respects_interval(self, mock_resend_cls, _mock_html):
        mock_client = mock.Mock()
        mock_client.send_email.return_value = "msg_123"
        mock_resend_cls.return_value = mock_client

        self.user.email = "vendeuse@test.com"
        self.user.save(update_fields=["email"])

        subscription = SellerSubscription.objects.create(
            seller=self.seller,
            plan=SellerProfile.Plan.PRO,
            amount_xof=10000,
            status=SellerSubscription.Status.APPROVED,
            starts_at=timezone.now() - timedelta(days=27),
            ends_at=timezone.now() + timedelta(days=3),
        )

        from apps.notifications.models import Notification
        from .services import remind_expiring_subscriptions

        sent = remind_expiring_subscriptions()

        self.assertEqual(sent, 1)
        self.assertEqual(Notification.objects.filter(event=Notification.Event.SUBSCRIPTION_EXPIRING).count(), 1)
        subscription.refresh_from_db()
        self.assertIsNotNone(subscription.last_expiry_reminder_at)

        sent2 = remind_expiring_subscriptions()
        self.assertEqual(sent2, 0)
        self.assertEqual(Notification.objects.filter(event=Notification.Event.SUBSCRIPTION_EXPIRING).count(), 1)


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
        self.assertEqual(prices["BUSINESS"], 15000)
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

    def test_dashboard_activity_for_pro(self):
        self.seller.plan = SellerProfile.Plan.PRO
        self.seller.save(update_fields=["plan"])

        category = CategoryFactory(name="Tissus", slug="tissus-pro")
        product = ProductFactory(
            seller=self.seller, category=category, name="Pagne", slug="pagne-pro", price_xof=5000, stock=5
        )
        customer = UserFactory(username="client-pro")

        order1 = OrderFactory(
            customer=customer,
            full_name="M. Client",
            phone="+2290191111111",
            email="client@example.com",
            address="Rue des Cocotiers",
            city="Cotonou",
            status=Order.Status.RECEIVED,
            total_xof=10000,
        )
        OrderItemFactory(order=order1, product=product, quantity=2, unit_price_xof=5000)

        order2 = OrderFactory(
            customer=customer,
            full_name="Mme Autre",
            phone="+2290192222222",
            email="autre@example.com",
            address="Rue des Palmiers",
            city="Porto-Novo",
            status=Order.Status.RECEIVED,
            total_xof=5000,
        )
        OrderItemFactory(order=order2, product=product, quantity=1, unit_price_xof=5000)

        response = self.client.get("/api/seller/dashboard/")

        self.assertEqual(response.status_code, 200)
        activity = response.data["activity"]
        self.assertIsNotNone(activity)
        self.assertEqual(len(activity["by_hour"]), 24)
        self.assertEqual(len(activity["by_weekday"]), 7)
        self.assertEqual(sum(activity["by_hour"]), 2)
        self.assertIsNotNone(activity["peak_hour"])

    def test_dashboard_activity_hidden_for_free(self):
        response = self.client.get("/api/seller/dashboard/")

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.data["activity"])


class SellerSubscriptionRelaunchTests(APITestCase):
    """Le vendeur relance lui-même le paiement d'un abonnement échoué."""

    def setUp(self):
        self.user = UserFactory(username="relance-vendeuse")
        self.seller = SellerProfileFactory(
            user=self.user, display_name="Relance Boutique", phone="+2290190000000"
        )
        ShopFactory(seller=self.seller, name="Relance Wax", whatsapp_phone="+2290190000000")
        self.client.force_authenticate(user=self.user)

    def _failed_subscription(self):
        return SellerSubscription.objects.create(
            seller=self.seller,
            plan=SellerProfile.Plan.STARTER,
            amount_xof=5000,
            status=SellerSubscription.Status.FAILED,
        )

    def test_relaunch_creates_new_pending_subscription(self):
        self._failed_subscription()

        with _fedapay_success_mock():
            response = self.client.post("/api/seller/subscription/relance-paiement/")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], SellerSubscription.Status.PENDING)
        self.assertEqual(response.data["payment_url"], "https://sandbox-pay.fedapay.com/t/42")
        self.assertEqual(self.seller.subscriptions.count(), 2)

    def test_relaunch_rejects_pending_subscription(self):
        SellerSubscription.objects.create(
            seller=self.seller,
            plan=SellerProfile.Plan.PRO,
            amount_xof=10000,
            status=SellerSubscription.Status.PENDING,
        )

        response = self.client.post("/api/seller/subscription/relance-paiement/")

        self.assertEqual(response.status_code, 400)

    def test_relaunch_without_subscription_returns_400(self):
        response = self.client.post("/api/seller/subscription/relance-paiement/")
        self.assertEqual(response.status_code, 400)

    def test_relaunch_marks_new_subscription_failed_on_fedapay_error(self):
        self._failed_subscription()

        with mock.patch(
            "apps.payments.services.requests.post",
            side_effect=requests.exceptions.ConnectionError,
        ):
            response = self.client.post("/api/seller/subscription/relance-paiement/")

        self.assertEqual(response.status_code, 400)
        statuses = list(self.seller.subscriptions.values_list("status", flat=True))
        self.assertEqual(statuses.count(SellerSubscription.Status.FAILED), 2)


class SellerSubscriptionCancelTests(APITestCase):
    """Résiliation et réactivation d'un abonnement vendeur (US-908)."""

    def setUp(self):
        self.user = UserFactory(username="resiliation-vendeuse")
        self.seller = SellerProfileFactory(
            user=self.user, display_name="Résiliation Boutique", phone="+2290190000000"
        )
        ShopFactory(seller=self.seller, name="Résiliation Wax", whatsapp_phone="+2290190000000")
        self.client.force_authenticate(user=self.user)

    def _approved_subscription(self, **kwargs):
        defaults = {
            "seller": self.seller,
            "plan": SellerProfile.Plan.PRO,
            "amount_xof": 10000,
            "status": SellerSubscription.Status.APPROVED,
            "starts_at": timezone.now() - timedelta(days=5),
            "ends_at": timezone.now() + timedelta(days=25),
        }
        defaults.update(kwargs)
        return SellerSubscription.objects.create(**defaults)

    def _mock_email(self, mock_resend_cls):
        mock_client = mock.Mock()
        mock_client.send_email.return_value = "msg_123"
        mock_resend_cls.return_value = mock_client
        self.user.email = "vendeuse@test.com"
        self.user.save(update_fields=["email"])

    @mock.patch("apps.notifications.services._render_email_html", return_value="<html></html>")
    @mock.patch("apps.notifications.services.ResendClient")
    def test_cancel_sets_cancel_requested_at_keeps_plan_and_sends_email(self, mock_resend_cls, _mock_html):
        self._mock_email(mock_resend_cls)
        subscription = self._approved_subscription()
        self.seller.plan = SellerProfile.Plan.PRO
        self.seller.save(update_fields=["plan"])

        from apps.notifications.models import Notification

        response = self.client.post("/api/seller/subscription/cancel/")

        self.assertEqual(response.status_code, 200)
        subscription.refresh_from_db()
        self.assertIsNotNone(subscription.cancel_requested_at)
        self.assertEqual(subscription.status, SellerSubscription.Status.APPROVED)
        self.seller.refresh_from_db()
        self.assertEqual(self.seller.plan, SellerProfile.Plan.PRO)
        self.assertEqual(
            Notification.objects.filter(event=Notification.Event.SUBSCRIPTION_CANCELED).count(), 1
        )

    def test_cancel_without_active_subscription_returns_400(self):
        response = self.client.post("/api/seller/subscription/cancel/")
        self.assertEqual(response.status_code, 400)

    @mock.patch("apps.notifications.services._render_email_html", return_value="<html></html>")
    @mock.patch("apps.notifications.services.ResendClient")
    def test_double_cancel_returns_400(self, mock_resend_cls, _mock_html):
        self._mock_email(mock_resend_cls)
        self._approved_subscription()

        first = self.client.post("/api/seller/subscription/cancel/")
        second = self.client.post("/api/seller/subscription/cancel/")

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 400)

    @mock.patch("apps.notifications.services._render_email_html", return_value="<html></html>")
    @mock.patch("apps.notifications.services.ResendClient")
    def test_reactivate_clears_cancel_requested_at(self, mock_resend_cls, _mock_html):
        self._mock_email(mock_resend_cls)
        subscription = self._approved_subscription()

        cancel = self.client.post("/api/seller/subscription/cancel/")
        self.assertEqual(cancel.status_code, 200)

        response = self.client.post("/api/seller/subscription/reactivate/")

        self.assertEqual(response.status_code, 200)
        subscription.refresh_from_db()
        self.assertIsNone(subscription.cancel_requested_at)

    def test_reactivate_without_cancellation_returns_400(self):
        self._approved_subscription()

        response = self.client.post("/api/seller/subscription/reactivate/")

        self.assertEqual(response.status_code, 400)

    @mock.patch("apps.notifications.services._render_email_html", return_value="<html></html>")
    @mock.patch("apps.notifications.services.ResendClient")
    def test_remind_canceled_subscription_mentions_lost_features(self, mock_resend_cls, _mock_html):
        self._mock_email(mock_resend_cls)
        self._approved_subscription(
            starts_at=timezone.now() - timedelta(days=27),
            ends_at=timezone.now() + timedelta(days=3),
            cancel_requested_at=timezone.now(),
        )

        from apps.notifications.models import Notification
        from .services import remind_expiring_subscriptions

        sent = remind_expiring_subscriptions()

        self.assertEqual(sent, 1)
        notification = Notification.objects.filter(
            event=Notification.Event.SUBSCRIPTION_EXPIRING
        ).first()
        self.assertIsNotNone(notification)
        self.assertIn("perdrez", notification.message)

    def test_expire_subscriptions_downgrades_canceled_subscription(self):
        self._approved_subscription(
            starts_at=timezone.now() - timedelta(days=60),
            ends_at=timezone.now() - timedelta(days=1),
            cancel_requested_at=timezone.now() - timedelta(days=10),
        )
        self.seller.plan = SellerProfile.Plan.PRO
        self.seller.save(update_fields=["plan"])

        from .services import expire_subscriptions

        downgraded = expire_subscriptions()

        self.assertEqual(downgraded, 1)
        self.seller.refresh_from_db()
        self.assertEqual(self.seller.plan, SellerProfile.Plan.FREE)


class SellerUpgradeProrataTests(APITestCase):
    """Upgrade au prorata (ANIF Seller) : devis, création, activation, relance."""

    def setUp(self):
        self.user = UserFactory(username="prorata-vendeuse")
        self.seller = SellerProfileFactory(
            user=self.user, display_name="Prorata Boutique", phone="+2290190000000"
        )
        ShopFactory(seller=self.seller, name="Prorata Wax", whatsapp_phone="+2290190000000")
        self.client.force_authenticate(user=self.user)

    def _active_starter(self, days=15):
        self.seller.plan = SellerProfile.Plan.STARTER
        self.seller.save(update_fields=["plan"])
        return SellerSubscription.objects.create(
            seller=self.seller,
            plan=SellerProfile.Plan.STARTER,
            amount_xof=5000,
            status=SellerSubscription.Status.APPROVED,
            starts_at=timezone.now() - timedelta(days=15),
            ends_at=timezone.now() + timedelta(days=days),
        )

    def test_quote_upgrade_prorata(self):
        sub = self._active_starter(days=15)

        from .services import compute_quote

        quote = compute_quote(self.seller, SellerProfile.Plan.PRO)

        self.assertTrue(quote["is_upgrade"])
        self.assertEqual(quote["amount_xof"], 2500)
        self.assertEqual(quote["full_price_xof"], 10000)
        self.assertEqual(quote["credit_xof"], 5000)
        self.assertEqual(quote["ends_at"], sub.ends_at)

    def test_quote_endpoint_returns_prorata(self):
        self._active_starter(days=15)

        response = self.client.get("/api/seller/subscription/quote/?plan=PRO")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["is_upgrade"])
        self.assertEqual(response.data["amount_xof"], 2500)
        self.assertIsNotNone(response.data["ends_at"])

    def test_post_creates_upgrade_subscription(self):
        sub = self._active_starter(days=15)

        with _fedapay_success_mock():
            response = self.client.post(
                "/api/seller/subscription/", {"plan": "PRO"}, format="json"
            )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["is_upgrade"])
        self.assertEqual(response.data["amount_xof"], 2500)
        created = SellerSubscription.objects.get(id=response.data["id"])
        self.assertEqual(created.ends_at, sub.ends_at)

    def test_activation_preserves_ends_at_and_switches_plan(self):
        sub = self._active_starter(days=15)
        upgrade = SellerSubscription.objects.create(
            seller=self.seller,
            plan=SellerProfile.Plan.PRO,
            amount_xof=2500,
            is_upgrade=True,
            ends_at=sub.ends_at,
            status=SellerSubscription.Status.PENDING,
        )

        from .services import apply_subscription_status

        apply_subscription_status(upgrade, SellerSubscription.Status.APPROVED)

        self.seller.refresh_from_db()
        self.assertEqual(self.seller.plan, SellerProfile.Plan.PRO)
        upgrade.refresh_from_db()
        self.assertEqual(upgrade.ends_at, sub.ends_at)
        self.assertIsNotNone(upgrade.starts_at)

    def test_downgrade_returns_400(self):
        self.seller.plan = SellerProfile.Plan.PRO
        self.seller.save(update_fields=["plan"])
        SellerSubscription.objects.create(
            seller=self.seller,
            plan=SellerProfile.Plan.PRO,
            amount_xof=10000,
            status=SellerSubscription.Status.APPROVED,
            starts_at=timezone.now() - timedelta(days=15),
            ends_at=timezone.now() + timedelta(days=15),
        )

        response = self.client.get("/api/seller/subscription/quote/?plan=STARTER")

        self.assertEqual(response.status_code, 400)

    def test_free_to_pro_charges_full_price(self):
        response = self.client.get("/api/seller/subscription/quote/?plan=PRO")

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["is_upgrade"])
        self.assertEqual(response.data["amount_xof"], 10000)
        self.assertIsNone(response.data["ends_at"])

    def test_expired_subscription_charges_full_price(self):
        self.seller.plan = SellerProfile.Plan.STARTER
        self.seller.save(update_fields=["plan"])
        SellerSubscription.objects.create(
            seller=self.seller,
            plan=SellerProfile.Plan.STARTER,
            amount_xof=5000,
            status=SellerSubscription.Status.APPROVED,
            starts_at=timezone.now() - timedelta(days=45),
            ends_at=timezone.now() - timedelta(days=15),
        )

        response = self.client.get("/api/seller/subscription/quote/?plan=PRO")

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["is_upgrade"])
        self.assertEqual(response.data["amount_xof"], 10000)

    def test_relaunch_failed_upgrade_recomputes_quote(self):
        sub = self._active_starter(days=15)
        SellerSubscription.objects.create(
            seller=self.seller,
            plan=SellerProfile.Plan.PRO,
            amount_xof=2500,
            is_upgrade=True,
            ends_at=sub.ends_at,
            status=SellerSubscription.Status.FAILED,
        )

        with _fedapay_success_mock():
            response = self.client.post("/api/seller/subscription/relance-paiement/")

        self.assertEqual(response.status_code, 201)
        new_sub = SellerSubscription.objects.get(id=response.data["id"])
        self.assertTrue(new_sub.is_upgrade)
        self.assertEqual(new_sub.amount_xof, 2500)
        self.assertEqual(new_sub.ends_at, sub.ends_at)

