from unittest import mock

import requests
from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.delivery.models import Delivery, DeliverySlot, DeliveryZone
from apps.orders.models import Order
from apps.payments.models import Payment
from apps.users.models import Profile

from .models import Notification
from .services import (
    notify_account_created,
    notify_delivery_confirmed,
    notify_delivery_in_transit,
    notify_invoice,
    notify_order_confirmation,
)

User = get_user_model()


class NotificationServiceTests(TestCase):
    def setUp(self):
        self.order = Order.objects.create(full_name="Client", phone="+22990000000", address="Cotonou", total_xof=1000)

    @mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_notify_order_confirmation_stores_failed_status_on_provider_error(self, mock_post):
        notification = notify_order_confirmation(self.order)
        self.assertEqual(notification.status, Notification.Status.FAILED)
        self.assertEqual(notification.event, Notification.Event.ORDER_CONFIRMATION)
        self.assertIn("Client", notification.message)

    def test_notify_order_confirmation_stores_sent_status_on_success(self):
        response = mock.Mock()
        response.raise_for_status.return_value = None
        response.json.return_value = {"messages": [{"id": "wamid.abc"}]}

        with mock.patch("apps.notifications.services.requests.post", return_value=response):
            notification = notify_order_confirmation(self.order)

        self.assertEqual(notification.status, Notification.Status.SENT)
        self.assertEqual(notification.provider_message_id, "wamid.abc")

    @mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_notify_delivery_in_transit(self, mock_post):
        zone = DeliveryZone.objects.create(name="Zone Test", fee_xof=500)
        slot = DeliverySlot.objects.create(label="Créneau Test", start_time="08:00", end_time="12:00")
        delivery = Delivery.objects.create(order=self.order, zone=zone, slot=slot, status="in_transit")

        notification = notify_delivery_in_transit(delivery)

        self.assertEqual(notification.event, Notification.Event.DELIVERY_IN_TRANSIT)
        self.assertIn("Zone Test", notification.message)

    @mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_notify_delivery_confirmed(self, mock_post):
        zone = DeliveryZone.objects.create(name="Zone Test", fee_xof=500)
        slot = DeliverySlot.objects.create(label="Créneau Test", start_time="08:00", end_time="12:00")
        delivery = Delivery.objects.create(order=self.order, zone=zone, slot=slot, status="delivered")

        notification = notify_delivery_confirmed(delivery)

        self.assertEqual(notification.channel, Notification.Channel.WHATSAPP)
        self.assertEqual(notification.event, Notification.Event.DELIVERY_CONFIRMED)

    @mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_notify_invoice(self, mock_post):
        payment = Payment.objects.create(order=self.order, method="mtn", amount_xof=1000)

        notification = notify_invoice(payment)

        self.assertEqual(notification.event, Notification.Event.INVOICE)
        self.assertIn("facture", notification.message.lower())

    def test_order_confirmation_routes_to_email_when_customer_prefers_email(self):
        user = User.objects.create_user(username="emailfan", email="fan@example.com")
        Profile.objects.create(user=user, notification_channel=Profile.NotificationChannel.EMAIL)
        order = Order.objects.create(
            customer=user, full_name="Fan", phone="+22990000001", email="fan@example.com",
            address="Cotonou", total_xof=2000,
        )

        response = mock.Mock()
        response.raise_for_status.return_value = None
        response.json.return_value = {"id": "resend-id-1"}

        with mock.patch("apps.notifications.services.requests.post", return_value=response) as mock_post:
            notification = notify_order_confirmation(order)

        self.assertEqual(notification.channel, Notification.Channel.EMAIL)
        self.assertEqual(notification.recipient_email, "fan@example.com")
        self.assertEqual(notification.status, Notification.Status.SENT)
        self.assertEqual(notification.provider_message_id, "resend-id-1")
        called_url = mock_post.call_args.args[0]
        self.assertIn("resend.com", called_url)

    def test_order_confirmation_falls_back_to_whatsapp_when_email_preferred_but_missing(self):
        user = User.objects.create_user(username="noemail")
        Profile.objects.create(user=user, notification_channel=Profile.NotificationChannel.EMAIL)
        order = Order.objects.create(
            customer=user, full_name="Sans Email", phone="+22990000002", address="Cotonou", total_xof=1500
        )

        with mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError):
            notification = notify_order_confirmation(order)

        self.assertEqual(notification.channel, Notification.Channel.WHATSAPP)
        self.assertEqual(notification.recipient_phone, "+22990000002")

    def test_notify_account_created_whatsapp_default(self):
        user = User.objects.create_user(username="whatsappuser")
        Profile.objects.create(user=user, phone="+22990000003")

        with mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError):
            notification = notify_account_created(user)

        self.assertEqual(notification.channel, Notification.Channel.WHATSAPP)
        self.assertEqual(notification.event, Notification.Event.ACCOUNT_CREATED)
        self.assertEqual(notification.recipient_phone, "+22990000003")

    def test_notify_account_created_email_preference(self):
        user = User.objects.create_user(username="emailuser", email="new@example.com")
        Profile.objects.create(user=user, notification_channel=Profile.NotificationChannel.EMAIL)

        response = mock.Mock()
        response.raise_for_status.return_value = None
        response.json.return_value = {"id": "resend-id-2"}

        with mock.patch("apps.notifications.services.requests.post", return_value=response):
            notification = notify_account_created(user)

        self.assertEqual(notification.channel, Notification.Channel.EMAIL)
        self.assertEqual(notification.recipient_email, "new@example.com")

    def test_notify_account_created_whatsapp_without_phone_does_not_send(self):
        user = User.objects.create_user(username="nophoneuser")
        Profile.objects.create(user=user)

        notification = notify_account_created(user)

        self.assertIsNone(notification)
        self.assertEqual(Notification.objects.count(), 0)
