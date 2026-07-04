import hashlib
import hmac
import json
from unittest import mock

import requests
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APITestCase
from rest_framework.throttling import ScopedRateThrottle

from apps.orders.models import Order, OrderItem
from apps.products.models import Category, Product

from .models import Payment, PaymentSettings

User = get_user_model()


def _sign(body: str, secret: str, timestamp: str = "1700000000") -> str:
    signed_payload = f"{timestamp}.{body}".encode()
    signature = hmac.new(secret.encode(), signed_payload, hashlib.sha256).hexdigest()
    return f"t={timestamp},s={signature}"


class PaymentApiTests(APITestCase):
    def setUp(self):
        category = Category.objects.create(name="Tissus", slug="tissus")
        product = Product.objects.create(category=category, name="Pagne", slug="pagne", price_xof=1000, stock=5)
        self.owner = User.objects.create_user(username="owner", password="pass1234")
        self.other_user = User.objects.create_user(username="other", password="pass1234")
        self.order = Order.objects.create(
            customer=self.owner, full_name="Client", phone="+22990000000", address="Cotonou", total_xof=1000
        )
        OrderItem.objects.create(order=self.order, product=product, quantity=1, unit_price_xof=1000)
        self.staff_user = User.objects.create_user(username="admin", password="pass1234", is_staff=True)

    @mock.patch("apps.payments.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_initiate_payment_handles_provider_failure_gracefully(self, mock_post):
        response = self.client.post(
            "/api/payments/initiate/", {"order_id": self.order.id, "method": "mtn"}, format="json"
        )
        self.assertEqual(response.status_code, 502)
        payment = Payment.objects.get(order=self.order)
        self.assertEqual(payment.status, Payment.Status.FAILED)

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
        """US-38 : chaque appel coûte un appel API FedaPay réel, donc scope dédié
        plus strict que le throttle anon générique (voir apps.payments.views).

        ScopedRateThrottle.THROTTLE_RATES est figé en attribut de classe au chargement
        du module DRF : override_settings(REST_FRAMEWORK=...) ne le rafraîchit pas, il
        faut patcher le dict directement (mock.patch.dict) pour abaisser le taux dans un
        test rapide. Le cache de throttling (process-wide) doit aussi être vidé : les
        autres tests de cette classe appellent déjà /api/payments/initiate/ et laissent
        un historique pour le même ident (127.0.0.1) sous le même scope "payments"."""
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
        payment = Payment.objects.create(
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

    def test_anonymous_cannot_list_payments(self):
        response = self.client.get("/api/payments/")
        self.assertEqual(response.status_code, 401)

    def test_staff_can_list_payments(self):
        Payment.objects.create(order=self.order, method="mtn", amount_xof=1000)
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get("/api/payments/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 1)

    def test_owner_can_retrieve_own_payment(self):
        payment = Payment.objects.create(order=self.order, method="mtn", amount_xof=1000)
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/payments/{payment.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["id"], payment.id)

    def test_other_customer_cannot_retrieve_someone_elses_payment(self):
        payment = Payment.objects.create(order=self.order, method="mtn", amount_xof=1000)
        self.client.force_authenticate(user=self.other_user)
        response = self.client.get(f"/api/payments/{payment.id}/")
        self.assertEqual(response.status_code, 404)

    def test_owner_sees_only_own_payments_in_list(self):
        other_order = Order.objects.create(
            customer=self.other_user, full_name="Autre", phone="+22990000001", address="Cotonou", total_xof=500
        )
        Payment.objects.create(order=self.order, method="mtn", amount_xof=1000)
        Payment.objects.create(order=other_order, method="moov", amount_xof=500)

        self.client.force_authenticate(user=self.owner)
        response = self.client.get("/api/payments/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["order"], self.order.id)
