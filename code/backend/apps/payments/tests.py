import hashlib
import hmac
import json
from unittest import mock

import requests
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APITestCase
from rest_framework.throttling import ScopedRateThrottle

from apps.core.factories import (
    CategoryFactory,
    CouponFactory,
    OrderFactory,
    OrderItemFactory,
    PaymentFactory,
    ProductFactory,
    SuperUserFactory,
    UserFactory,
)
from apps.notifications.models import BackofficeNotification, Notification
from apps.orders.models import Order, OrderItem

from .models import Payment, PaymentSettings
from .services import FedaPayError, PaymentRelaunchError, relaunch_payment

User = get_user_model()


def _sign(body: str, secret: str, timestamp: str = "1700000000") -> str:
    signed_payload = f"{timestamp}.{body}".encode()
    signature = hmac.new(secret.encode(), signed_payload, hashlib.sha256).hexdigest()
    return f"t={timestamp},s={signature}"


class PaymentApiTests(APITestCase):
    def setUp(self):
        self.category = CategoryFactory(name="Tissus", slug="tissus")
        self.product = ProductFactory(
            category=self.category, name="Pagne", slug="pagne", price_xof=1000, stock=5
        )
        self.owner = UserFactory(username="owner")
        self.other_user = UserFactory(username="other")
        self.order = OrderFactory(
            customer=self.owner, full_name="Client", phone="+2290190000000", address="Cotonou", total_xof=1000
        )
        OrderItemFactory(order=self.order, product=self.product, quantity=1, unit_price_xof=1000)
        self.staff_user = UserFactory(username="admin", is_staff=True)

    @mock.patch("apps.payments.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_initiate_payment_handles_provider_failure_gracefully(self, mock_post):
        response = self.client.post(
            "/api/payments/initiate/", {"order_id": self.order.id, "method": "mtn"}, format="json"
        )
        self.assertEqual(response.status_code, 502)
        payment = Payment.objects.get(order=self.order)
        self.assertEqual(payment.status, Payment.Status.FAILED)
        self.assertTrue(
            BackofficeNotification.objects.filter(kind=BackofficeNotification.Kind.PAYMENT_FAILED).exists()
        )

    def test_initiate_payment_succeeds_with_mocked_provider(self):
        transaction_response = mock.Mock()
        transaction_response.json.return_value = {"v1/transaction": {"id": 42}}
        transaction_response.raise_for_status.return_value = None
        token_response = mock.Mock()
        token_response.json.return_value = {"url": "https://sandbox-pay.fedapay.com/t/42"}
        token_response.raise_for_status.return_value = None

        with mock.patch(
            "apps.payments.services.requests.post", side_effect=[transaction_response, token_response]
        ):
            response = self.client.post(
                "/api/payments/initiate/", {"order_id": self.order.id, "method": "mtn"}, format="json"
            )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["fedapay_transaction_id"], "42")
        self.assertEqual(response.data["payment_url"], "https://sandbox-pay.fedapay.com/t/42")

    def test_initiate_payment_is_rate_limited(self):
        cache.clear()
        transaction_response = mock.Mock()
        transaction_response.json.return_value = {"v1/transaction": {"id": 42}}
        transaction_response.raise_for_status.return_value = None
        token_response = mock.Mock()
        token_response.json.return_value = {"url": "https://sandbox-pay.fedapay.com/t/42"}
        token_response.raise_for_status.return_value = None

        with mock.patch.dict(ScopedRateThrottle.THROTTLE_RATES, {"payments": "2/minute"}):
            with mock.patch(
                "apps.payments.services.requests.post",
                side_effect=[transaction_response, token_response] * 3,
            ):
                statuses = [
                    self.client.post(
                        "/api/payments/initiate/", {"order_id": self.order.id, "method": "mtn"}, format="json"
                    ).status_code
                    for _ in range(3)
                ]

        self.assertEqual(statuses[:2], [201, 201])
        self.assertEqual(statuses[2], 429)

    def test_initiate_payment_rejected_when_online_payment_disabled(self):
        PaymentSettings.objects.update_or_create(pk=1, defaults={"online_payment_enabled": False})
        response = self.client.post(
            "/api/payments/initiate/", {"order_id": self.order.id, "method": "mtn"}, format="json"
        )
        self.assertEqual(response.status_code, 503)
        self.assertEqual(Payment.objects.count(), 0)

    def test_initiate_cash_on_delivery_creates_pending_payment_without_fedapay(self):
        PaymentSettings.objects.update_or_create(pk=1, defaults={"online_payment_enabled": False})

        with mock.patch("apps.payments.views.start_fedapay_transaction") as start_transaction:
            response = self.client.post(
                "/api/payments/initiate/",
                {"order_id": self.order.id, "method": "cash_on_delivery"},
                format="json",
            )

        self.assertEqual(response.status_code, 201)
        start_transaction.assert_not_called()
        payment = Payment.objects.get(order=self.order)
        self.assertEqual(payment.provider, Payment.Provider.CASH_ON_DELIVERY)
        self.assertEqual(payment.method, Payment.Method.CASH_ON_DELIVERY)
        self.assertEqual(payment.status, Payment.Status.PENDING)
        self.assertEqual(payment.amount_xof, self.order.total_xof)
        self.assertEqual(payment.payment_url, "")

    def test_initiate_payment_rejected_when_method_disabled(self):
        PaymentSettings.objects.update_or_create(pk=1, defaults={"card_enabled": False})
        response = self.client.post(
            "/api/payments/initiate/", {"order_id": self.order.id, "method": "card"}, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Payment.objects.count(), 0)

    @override_settings(FEDAPAY_WEBHOOK_SECRET="test_webhook_secret")
    def test_webhook_rejects_invalid_signature(self):
        body = json.dumps({"name": "transaction.approved", "entity": {"id": "999"}})
        response = self.client.post(
            "/api/payments/webhook/",
            data=body,
            content_type="application/json",
            HTTP_X_FEDAPAY_SIGNATURE="t=1,s=invalide",
        )
        self.assertEqual(response.status_code, 401)

    @override_settings(FEDAPAY_WEBHOOK_SECRET="test_webhook_secret")
    @mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_webhook_approves_payment_and_updates_order(self, mock_post):
        payment = PaymentFactory(
            order=self.order, method="mtn", amount_xof=1000, fedapay_transaction_id="777"
        )
        body = json.dumps({"name": "transaction.approved", "entity": {"id": "777"}})
        signature = _sign(body, "test_webhook_secret")

        response = self.client.post(
            "/api/payments/webhook/",
            data=body,
            content_type="application/json",
            HTTP_X_FEDAPAY_SIGNATURE=signature,
        )

        self.assertEqual(response.status_code, 200)
        payment.refresh_from_db()
        self.order.refresh_from_db()
        self.assertEqual(payment.status, Payment.Status.APPROVED)
        self.assertEqual(self.order.status, Order.Status.PREPARED)

    @override_settings(FEDAPAY_WEBHOOK_SECRET="test_webhook_secret")
    def test_webhook_declined_creates_backoffice_notification(self):
        payment = PaymentFactory(
            order=self.order, method="mtn", amount_xof=1000, fedapay_transaction_id="888"
        )
        body = json.dumps({"name": "transaction.declined", "entity": {"id": "888"}})
        signature = _sign(body, "test_webhook_secret")

        response = self.client.post(
            "/api/payments/webhook/",
            data=body,
            content_type="application/json",
            HTTP_X_FEDAPAY_SIGNATURE=signature,
        )

        self.assertEqual(response.status_code, 200)
        payment.refresh_from_db()
        self.assertEqual(payment.status, Payment.Status.DECLINED)
        notification = BackofficeNotification.objects.get(kind=BackofficeNotification.Kind.PAYMENT_FAILED)
        self.assertIn(f"/admin/payments/payment/{payment.pk}/change/", notification.action_url)

    def test_anonymous_cannot_list_payments(self):
        response = self.client.get("/api/payments/")
        self.assertEqual(response.status_code, 401)

    def test_staff_can_list_payments(self):
        PaymentFactory(order=self.order, method="mtn", amount_xof=1000)
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get("/api/payments/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 1)

    def test_owner_can_retrieve_own_payment(self):
        payment = PaymentFactory(order=self.order, method="mtn", amount_xof=1000)
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/payments/{payment.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["id"], payment.id)

    def test_other_customer_cannot_retrieve_someone_elses_payment(self):
        payment = PaymentFactory(order=self.order, method="mtn", amount_xof=1000)
        self.client.force_authenticate(user=self.other_user)
        response = self.client.get(f"/api/payments/{payment.id}/")
        self.assertEqual(response.status_code, 404)

    def test_owner_sees_only_own_payments_in_list(self):
        other_order = OrderFactory(
            customer=self.other_user, full_name="Autre", phone="+2290190000001", address="Cotonou", total_xof=500
        )
        PaymentFactory(order=self.order, method="mtn", amount_xof=1000)
        PaymentFactory(order=other_order, method="moov", amount_xof=500)

        self.client.force_authenticate(user=self.owner)
        response = self.client.get("/api/payments/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["order"], self.order.id)


def _fedapay_success_responses(transaction_id=99, url="https://sandbox-pay.fedapay.com/t/99"):
    transaction_response = mock.Mock()
    transaction_response.json.return_value = {"v1/transaction": {"id": transaction_id}}
    transaction_response.raise_for_status.return_value = None
    token_response = mock.Mock()
    token_response.json.return_value = {"url": url}
    token_response.raise_for_status.return_value = None
    return [transaction_response, token_response]


class PaymentRelaunchTests(APITestCase):
    def setUp(self):
        self.category = CategoryFactory(name="Tissus", slug="tissus")
        self.product = ProductFactory(
            category=self.category, name="Pagne", slug="pagne", price_xof=1000, stock=5
        )
        self.customer = UserFactory(
            username="cliente", email="cliente@example.com"
        )
        self.order = OrderFactory(
            customer=self.customer,
            full_name="Cliente",
            phone="+2290190000000",
            email="cliente@example.com",
            address="Cotonou",
            total_xof=1000,
        )
        OrderItemFactory(order=self.order, product=self.product, quantity=1, unit_price_xof=1000)
        self.failed_payment = PaymentFactory(
            order=self.order, method="mtn", amount_xof=1000, status=Payment.Status.DECLINED
        )

    @staticmethod
    def _mocked_providers_post():
        resend_response = mock.Mock()
        resend_response.json.return_value = {"id": "email_123"}
        resend_response.raise_for_status.return_value = None
        fedapay_responses = _fedapay_success_responses()

        def _post(url, **kwargs):
            if url.endswith("/emails"):
                return resend_response
            return fedapay_responses.pop(0)

        return mock.patch("apps.payments.services.requests.post", side_effect=_post)

    def _relaunch_with_mocked_providers(self, payment):
        with self._mocked_providers_post():
            return relaunch_payment(payment)

    def test_relaunch_creates_new_payment_and_sends_link_to_customer(self):
        new_payment = self._relaunch_with_mocked_providers(self.failed_payment)

        self.assertEqual(self.order.payments.count(), 2)
        self.assertEqual(new_payment.status, Payment.Status.PENDING)
        self.assertEqual(new_payment.fedapay_transaction_id, "99")
        self.assertEqual(new_payment.payment_url, "https://sandbox-pay.fedapay.com/t/99")
        self.failed_payment.refresh_from_db()
        self.assertEqual(self.failed_payment.status, Payment.Status.DECLINED)

        notification = Notification.objects.get(event=Notification.Event.PAYMENT_RETRY)
        self.assertEqual(notification.status, Notification.Status.SENT)
        self.assertEqual(notification.recipient_email, "cliente@example.com")
        self.assertIn(new_payment.payment_url, notification.message)

    def test_relaunch_rejects_pending_payment(self):
        pending = PaymentFactory(order=self.order, method="mtn", amount_xof=1000)
        with self.assertRaises(PaymentRelaunchError):
            relaunch_payment(pending)

    def test_relaunch_rejects_cash_on_delivery_payment(self):
        cod = PaymentFactory(order=self.order, canceled=True)
        with self.assertRaises(PaymentRelaunchError):
            relaunch_payment(cod)

    def test_relaunch_rejects_order_already_paid(self):
        PaymentFactory(order=self.order, method="mtn", amount_xof=1000, status=Payment.Status.APPROVED)
        with self.assertRaises(PaymentRelaunchError):
            relaunch_payment(self.failed_payment)
        self.assertEqual(self.order.payments.count(), 2)

    def test_relaunch_rejects_disabled_payment_method(self):
        PaymentSettings.objects.update_or_create(pk=1, defaults={"mtn_enabled": False})
        with self.assertRaises(PaymentRelaunchError):
            relaunch_payment(self.failed_payment)

    @mock.patch("apps.payments.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_relaunch_marks_new_payment_failed_on_fedapay_error(self, mock_post):
        with self.assertRaises(FedaPayError):
            relaunch_payment(self.failed_payment)

        new_payment = self.order.payments.exclude(pk=self.failed_payment.pk).get()
        self.assertEqual(new_payment.status, Payment.Status.FAILED)
        self.assertTrue(
            BackofficeNotification.objects.filter(kind=BackofficeNotification.Kind.PAYMENT_FAILED).exists()
        )

    def test_admin_action_relaunches_selected_payments(self):
        admin_user = SuperUserFactory(username="superadmin", email="admin@example.com")
        admin_user.set_password("pass-solide-1234")
        admin_user.save()
        self.client.force_login(admin_user)

        with self._mocked_providers_post():
            response = self.client.post(
                "/admin/payments/payment/",
                {"action": "relaunch_payments", "_selected_action": [self.failed_payment.pk]},
            )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(self.order.payments.count(), 2)
        self.assertTrue(Notification.objects.filter(event=Notification.Event.PAYMENT_RETRY).exists())


class PaymentAdminTests(TestCase):
    def setUp(self):
        from apps.core.factories import SuperUserFactory
        self.admin = SuperUserFactory(username="payment-admin")
        self.client.force_login(self.admin)

    def test_payment_changelist(self):
        response = self.client.get("/admin/payments/payment/")
        self.assertEqual(response.status_code, 200)

    def test_payment_add_form(self):
        response = self.client.get("/admin/payments/payment/add/")
        self.assertEqual(response.status_code, 200)

    def test_paymentsettings_changelist_redirects(self):
        from apps.payments.models import PaymentSettings
        PaymentSettings.get_solo()
        response = self.client.get("/admin/payments/paymentsettings/", follow=True)
        self.assertEqual(response.status_code, 200)

    def test_paymentsettings_cannot_add(self):
        response = self.client.get("/admin/payments/paymentsettings/add/")
        self.assertEqual(response.status_code, 403)

    def test_non_staff_cannot_access(self):
        from apps.core.factories import UserFactory
        user = UserFactory(username="regular-payment")
        self.client.force_login(user)
        response = self.client.get("/admin/payments/payment/")
        self.assertEqual(response.status_code, 302)
