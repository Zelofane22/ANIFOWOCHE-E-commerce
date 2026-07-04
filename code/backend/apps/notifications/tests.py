from unittest import mock

import requests
from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.delivery.models import Delivery, DeliverySlot, DeliveryZone
from apps.orders.models import Order
from apps.payments.models import Payment
from apps.users.models import Profile

from .models import Notification, NotificationSettings
from .services import (
    notify_account_created,
    notify_delivery_confirmed,
    notify_delivery_in_transit,
    notify_invoice,
    notify_order_confirmation,
)

User = get_user_model()


class NotificationServiceTests(TestCase):
    """Depuis Sprint 6 : WhatsApp/SMS restent bloqués par défaut
    (NotificationSettings.whatsapp_enabled/sms_enabled = False) tant qu'aucune
    vraie clé fournisseur n'est configurée — l'email est le canal par défaut,
    même pour les clients invités sans compte."""

    def setUp(self):
        self.order = Order.objects.create(
            full_name="Client", phone="+22990000000", email="client@example.com",
            address="Cotonou", total_xof=1000,
        )

    @mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_notify_order_confirmation_stores_failed_status_on_provider_error(self, mock_post):
        notification = notify_order_confirmation(self.order)
        self.assertEqual(notification.channel, Notification.Channel.EMAIL)
        self.assertEqual(notification.status, Notification.Status.FAILED)
        self.assertEqual(notification.event, Notification.Event.ORDER_CONFIRMATION)
        self.assertIn("Client", notification.message)

    def test_notify_order_confirmation_stores_sent_status_on_success(self):
        response = mock.Mock()
        response.raise_for_status.return_value = None
        response.json.return_value = {"id": "resend-id-order"}

        with mock.patch("apps.notifications.services.requests.post", return_value=response):
            notification = notify_order_confirmation(self.order)

        self.assertEqual(notification.channel, Notification.Channel.EMAIL)
        self.assertEqual(notification.status, Notification.Status.SENT)
        self.assertEqual(notification.provider_message_id, "resend-id-order")

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

        self.assertEqual(notification.channel, Notification.Channel.EMAIL)
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

    def test_order_confirmation_returns_none_when_no_email_and_whatsapp_disabled(self):
        """WhatsApp reste bloqué par défaut (Sprint 6) : un client préférant
        l'email mais n'ayant donné aucune adresse ne peut être notifié tant
        que l'admin n'a pas activé un canal téléphone (WhatsApp ou SMS)."""
        user = User.objects.create_user(username="noemail")
        Profile.objects.create(user=user, notification_channel=Profile.NotificationChannel.EMAIL)
        order = Order.objects.create(
            customer=user, full_name="Sans Email", phone="+22990000002", address="Cotonou", total_xof=1500
        )

        notification = notify_order_confirmation(order)

        self.assertIsNone(notification)
        self.assertEqual(Notification.objects.count(), 0)

    def test_order_confirmation_uses_whatsapp_when_preferred_and_admin_enabled(self):
        """Bascule admin (US Sprint 6) : dès que whatsapp_enabled=True et que
        le client préfère WhatsApp, le canal redevient utilisable."""
        NotificationSettings.objects.update_or_create(pk=1, defaults={"whatsapp_enabled": True})
        user = User.objects.create_user(username="whatsappfan")
        Profile.objects.create(
            user=user, phone="+22990000009", notification_channel=Profile.NotificationChannel.WHATSAPP
        )
        order = Order.objects.create(
            customer=user, full_name="Fan WhatsApp", phone="+22990000009", email="fan@example.com",
            address="Cotonou", total_xof=1800,
        )

        response = mock.Mock()
        response.raise_for_status.return_value = None
        response.json.return_value = {"messages": [{"id": "wamid.xyz"}]}

        with mock.patch("apps.notifications.services.requests.post", return_value=response):
            notification = notify_order_confirmation(order)

        self.assertEqual(notification.channel, Notification.Channel.WHATSAPP)
        self.assertEqual(notification.status, Notification.Status.SENT)

    def test_order_confirmation_sms_recorded_as_failed_without_provider(self):
        """SMS activé par l'admin mais aucun fournisseur réel branché : la
        tentative est tracée (visible admin) et marquée en échec plutôt que
        de disparaître silencieusement."""
        NotificationSettings.objects.update_or_create(pk=1, defaults={"sms_enabled": True})
        user = User.objects.create_user(username="smsfan")
        Profile.objects.create(
            user=user, phone="+22990000010", notification_channel=Profile.NotificationChannel.SMS
        )
        order = Order.objects.create(
            customer=user, full_name="Fan SMS", phone="+22990000010", address="Cotonou", total_xof=1200
        )

        notification = notify_order_confirmation(order)

        self.assertEqual(notification.channel, Notification.Channel.SMS)
        self.assertEqual(notification.status, Notification.Status.FAILED)
        self.assertIn("Aucun fournisseur SMS", notification.error_detail)

    def test_notify_account_created_defaults_to_email(self):
        user = User.objects.create_user(username="newuser", email="new@example.com")
        Profile.objects.create(user=user, phone="+22990000003")

        response = mock.Mock()
        response.raise_for_status.return_value = None
        response.json.return_value = {"id": "resend-id-welcome"}

        with mock.patch("apps.notifications.services.requests.post", return_value=response):
            notification = notify_account_created(user)

        self.assertEqual(notification.channel, Notification.Channel.EMAIL)
        self.assertEqual(notification.event, Notification.Event.ACCOUNT_CREATED)
        self.assertEqual(notification.recipient_email, "new@example.com")

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

    def test_notify_account_created_without_any_contact_info_does_not_send(self):
        user = User.objects.create_user(username="nophoneuser")
        Profile.objects.create(user=user)

        notification = notify_account_created(user)

        self.assertIsNone(notification)
        self.assertEqual(Notification.objects.count(), 0)


class NotificationSettingsAdminTests(TestCase):
    """Sprint 6 : bascule admin pour réactiver WhatsApp/SMS plus tard."""

    def setUp(self):
        self.admin_user = User.objects.create_superuser(username="root", password="pass1234")

    def test_get_solo_creates_row_with_channels_disabled_by_default(self):
        settings_row = NotificationSettings.get_solo()
        self.assertFalse(settings_row.whatsapp_enabled)
        self.assertFalse(settings_row.sms_enabled)
        self.assertEqual(NotificationSettings.objects.count(), 1)

    def test_changelist_redirects_to_the_singleton_change_form(self):
        self.client.force_login(self.admin_user)
        response = self.client.get("/admin/notifications/notificationsettings/", follow=True)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.redirect_chain[0][0], "/admin/notifications/notificationsettings/1/change/")

    def test_cannot_add_a_second_row(self):
        NotificationSettings.get_solo()
        self.client.force_login(self.admin_user)
        response = self.client.get("/admin/notifications/notificationsettings/add/")
        self.assertEqual(response.status_code, 403)
