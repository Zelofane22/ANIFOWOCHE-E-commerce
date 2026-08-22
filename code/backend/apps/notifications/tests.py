from datetime import timedelta
from unittest import mock

import requests
from django.contrib.auth import get_user_model
from django.db import ProgrammingError
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from .context_processors import backoffice_notifications
from apps.core.factories import (
    DeliveryFactory,
    DeliverySlotFactory,
    DeliveryZoneFactory,
    OrderFactory,
    PaymentFactory,
    ProfileFactory,
    UserFactory,
)
from apps.delivery.models import Delivery, DeliverySlot, DeliveryZone
from apps.orders.models import Order
from apps.payments.models import Payment
from apps.users.models import Profile

from .models import BackofficeNotification, Notification, NotificationSettings
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
        self.order = OrderFactory(
            full_name="Client", phone="+2290190000000", email="client@example.com",
            address="Cotonou", total_xof=1000,
        )

    @mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_notify_order_confirmation_stores_failed_status_on_provider_error(self, mock_post):
        notification = notify_order_confirmation(self.order)
        self.assertEqual(notification.channel, Notification.Channel.EMAIL)
        self.assertEqual(notification.status, Notification.Status.FAILED)
        self.assertEqual(notification.event, Notification.Event.ORDER_CONFIRMATION)
        self.assertIn("Client", notification.message)
        self.assertEqual(BackofficeNotification.objects.count(), 1)
        self.assertEqual(BackofficeNotification.objects.get().kind, BackofficeNotification.Kind.PROVIDER_ERROR)

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
        zone = DeliveryZoneFactory(name="Zone Test", fee_xof=500)
        slot = DeliverySlotFactory(label="Créneau Test", start_time="08:00", end_time="12:00")
        delivery = DeliveryFactory(order=self.order, zone=zone, slot=slot, status="in_transit")

        notification = notify_delivery_in_transit(delivery)

        self.assertEqual(notification.event, Notification.Event.DELIVERY_IN_TRANSIT)
        self.assertIn("Zone Test", notification.message)

    @mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_notify_delivery_confirmed(self, mock_post):
        zone = DeliveryZoneFactory(name="Zone Test", fee_xof=500)
        slot = DeliverySlotFactory(label="Créneau Test", start_time="08:00", end_time="12:00")
        delivery = DeliveryFactory(order=self.order, zone=zone, slot=slot, status="delivered")

        notification = notify_delivery_confirmed(delivery)

        self.assertEqual(notification.channel, Notification.Channel.EMAIL)
        self.assertEqual(notification.event, Notification.Event.DELIVERY_CONFIRMED)

    @mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_notify_invoice(self, mock_post):
        payment = PaymentFactory(order=self.order, method="mtn", amount_xof=1000)

        notification = notify_invoice(payment)

        self.assertEqual(notification.event, Notification.Event.INVOICE)
        self.assertIn("facture", notification.message.lower())

    def test_order_confirmation_routes_to_email_when_customer_prefers_email(self):
        user = UserFactory(username="emailfan", email="fan@example.com")
        ProfileFactory(user=user, notification_channel=Profile.NotificationChannel.EMAIL)
        order = OrderFactory(
            customer=user, full_name="Fan", phone="+2290190000001", email="fan@example.com",
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
        user = UserFactory(username="noemail")
        ProfileFactory(user=user, notification_channel=Profile.NotificationChannel.EMAIL)
        order = OrderFactory(
            customer=user, full_name="Sans Email", phone="+2290190000002", address="Cotonou", total_xof=1500
        )

        notification = notify_order_confirmation(order)

        self.assertIsNone(notification)
        self.assertEqual(Notification.objects.count(), 0)

    def test_order_confirmation_uses_whatsapp_when_preferred_and_admin_enabled(self):
        NotificationSettings.objects.update_or_create(pk=1, defaults={"whatsapp_enabled": True})
        user = UserFactory(username="whatsappfan")
        ProfileFactory(
            user=user, phone="+2290190000009", notification_channel=Profile.NotificationChannel.WHATSAPP
        )
        order = OrderFactory(
            customer=user, full_name="Fan WhatsApp", phone="+2290190000009", email="fan@example.com",
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
        NotificationSettings.objects.update_or_create(pk=1, defaults={"sms_enabled": True})
        user = UserFactory(username="smsfan")
        ProfileFactory(
            user=user, phone="+2290190000010", notification_channel=Profile.NotificationChannel.SMS
        )
        order = OrderFactory(
            customer=user, full_name="Fan SMS", phone="+2290190000010", address="Cotonou", total_xof=1200
        )

        notification = notify_order_confirmation(order)

        self.assertEqual(notification.channel, Notification.Channel.SMS)
        self.assertEqual(notification.status, Notification.Status.FAILED)
        self.assertIn("Aucun fournisseur SMS", notification.error_detail)
        self.assertEqual(BackofficeNotification.objects.get().kind, BackofficeNotification.Kind.CONFIGURATION)

    def test_notify_account_created_defaults_to_email(self):
        user = UserFactory(username="newuser", email="new@example.com")
        ProfileFactory(user=user, phone="+2290190000003")

        response = mock.Mock()
        response.raise_for_status.return_value = None
        response.json.return_value = {"id": "resend-id-welcome"}

        with mock.patch("apps.notifications.services.requests.post", return_value=response):
            notification = notify_account_created(user)

        self.assertEqual(notification.channel, Notification.Channel.EMAIL)
        self.assertEqual(notification.event, Notification.Event.ACCOUNT_CREATED)
        self.assertEqual(notification.recipient_email, "new@example.com")

    def test_notify_account_created_email_preference(self):
        user = UserFactory(username="emailuser", email="new@example.com")
        ProfileFactory(user=user, notification_channel=Profile.NotificationChannel.EMAIL)

        response = mock.Mock()
        response.raise_for_status.return_value = None
        response.json.return_value = {"id": "resend-id-2"}

        with mock.patch("apps.notifications.services.requests.post", return_value=response):
            notification = notify_account_created(user)

        self.assertEqual(notification.channel, Notification.Channel.EMAIL)
        self.assertEqual(notification.recipient_email, "new@example.com")
        self.assertEqual(notification.status, Notification.Status.SENT)
        self.assertEqual(notification.provider_message_id, "resend-id-2")

    def test_notify_account_created_without_any_contact_info_does_not_send(self):
        user = UserFactory(username="nophoneuser")
        ProfileFactory(user=user)

        notification = notify_account_created(user)

        self.assertIsNone(notification)
        self.assertEqual(Notification.objects.count(), 0)


class NotificationSettingsAdminTests(TestCase):
    def setUp(self):
        self.admin_user = UserFactory(username="root", is_staff=True, is_superuser=True)

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


class BackofficeNotificationAdminTests(TestCase):
    def setUp(self):
        self.admin_user = UserFactory(username="alerts-admin", is_staff=True, is_superuser=True)

    def test_header_exposes_unread_alert_icon_with_count(self):
        BackofficeNotification.objects.create(
            kind=BackofficeNotification.Kind.SYSTEM_ERROR,
            severity=BackofficeNotification.Severity.ERROR,
            title="Erreur test",
            message="Un problème nécessite une action.",
        )

        self.client.force_login(self.admin_user)
        response = self.client.get("/admin/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "/admin/notifications-backoffice/")
        self.assertContains(response, "anw-admin-alert-badge")

    def test_opening_backoffice_notifications_displays_without_deleting(self):
        BackofficeNotification.objects.create(
            kind=BackofficeNotification.Kind.CONFIGURATION,
            severity=BackofficeNotification.Severity.WARNING,
            title="Configuration à vérifier",
            message="Le fournisseur SMS est absent.",
        )

        self.client.force_login(self.admin_user)
        response = self.client.get("/admin/notifications-backoffice/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Configuration à vérifier")
        # Une simple consultation ne supprime plus l'alerte ni ne la marque lue.
        self.assertEqual(BackofficeNotification.objects.count(), 1)
        self.assertFalse(BackofficeNotification.objects.get().is_read)

    def test_marking_notification_read_hides_it_from_default_view_and_badge(self):
        notification = BackofficeNotification.objects.create(
            kind=BackofficeNotification.Kind.PAYMENT_FAILED,
            severity=BackofficeNotification.Severity.ERROR,
            title="Paiement échoué",
            message="Un paiement a échoué.",
        )

        self.client.force_login(self.admin_user)
        url = reverse("admin_backoffice_notification_read", args=[notification.pk])
        response = self.client.post(url, follow=True)

        self.assertEqual(response.status_code, 200)
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)
        self.assertIsNotNone(notification.read_at)

        # L'alerte lue disparaît de la vue par défaut (non lues uniquement).
        response = self.client.get("/admin/notifications-backoffice/")
        self.assertNotContains(response, "Paiement échoué")

        # Le badge d'en-tête ne compte plus que les non lues : plus aucun badge.
        response = self.client.get("/admin/")
        self.assertNotContains(response, "anw-admin-alert-badge")

        # L'alerte reste consultable dans l'historique via `?filter=all`.
        response = self.client.get("/admin/notifications-backoffice/?filter=all")
        self.assertContains(response, "Paiement échoué")

    def test_marking_notification_read_rejects_get_request(self):
        notification = BackofficeNotification.objects.create(
            kind=BackofficeNotification.Kind.CONFIGURATION,
            severity=BackofficeNotification.Severity.WARNING,
            title="Configuration à vérifier",
            message="Le fournisseur SMS est absent.",
        )

        self.client.force_login(self.admin_user)
        url = reverse("admin_backoffice_notification_read", args=[notification.pk])
        response = self.client.get(url)

        self.assertEqual(response.status_code, 405)
        # Aucun effet de bord sur un simple affichage : l'alerte reste non lue.
        notification.refresh_from_db()
        self.assertFalse(notification.is_read)
        self.assertIsNone(notification.read_at)
        self.assertEqual(BackofficeNotification.objects.count(), 1)

    def test_marking_all_notifications_read_marks_every_unread_alert(self):
        for index in range(3):
            BackofficeNotification.objects.create(
                kind=BackofficeNotification.Kind.SYSTEM_ERROR,
                severity=BackofficeNotification.Severity.ERROR,
                title=f"Erreur {index}",
                message=f"Problème {index}.",
            )
        # Une alerte déjà lue ne doit pas être re-marquée à tort.
        BackofficeNotification.objects.create(
            kind=BackofficeNotification.Kind.SYSTEM_ERROR,
            severity=BackofficeNotification.Severity.ERROR,
            title="Déjà lue",
            message="Ancienne alerte.",
            is_read=True,
            read_at=timezone.now() - timedelta(days=1),
        )

        self.client.force_login(self.admin_user)
        url = reverse("admin_backoffice_notifications_read_all")
        response = self.client.post(url, follow=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(BackofficeNotification.objects.filter(is_read=False).count(), 0)
        self.assertEqual(BackofficeNotification.objects.count(), 4)
        self.assertTrue(
            all(item.read_at is not None for item in BackofficeNotification.objects.filter(is_read=True))
        )

    def test_marking_all_notifications_read_rejects_get_request(self):
        BackofficeNotification.objects.create(
            kind=BackofficeNotification.Kind.SYSTEM_ERROR,
            severity=BackofficeNotification.Severity.ERROR,
            title="Erreur test",
            message="Un problème nécessite une action.",
        )

        self.client.force_login(self.admin_user)
        url = reverse("admin_backoffice_notifications_read_all")
        response = self.client.get(url)

        self.assertEqual(response.status_code, 405)
        self.assertEqual(BackofficeNotification.objects.filter(is_read=False).count(), 1)

    def test_context_processor_does_not_break_when_table_is_missing(self):
        request = mock.Mock()
        request.path = "/admin/"
        request.user = self.admin_user

        with mock.patch.object(BackofficeNotification.objects, "filter", side_effect=ProgrammingError):
            context = backoffice_notifications(request)

        self.assertEqual(context["backoffice_notifications_count"], 0)


class SensitiveActionNotificationTests(TestCase):
    """Tests des signaux qui déclenchent des notifications d'actions sensibles
    (suppression produit/commande/staff, changement permissions, changement prix)."""

    def setUp(self):
        self.superuser = UserFactory(
            username="alertadmin", email="alert@example.com",
            is_staff=True, is_superuser=True,
        )
        self.category = None

    def _patch_email_succeed(self):
        response = mock.Mock()
        response.raise_for_status.return_value = None
        response.json.return_value = {"id": "resend-sensitive-1"}
        return mock.patch("apps.notifications.services.requests.post", return_value=response)

    def _patch_email_fail(self):
        return mock.patch(
            "apps.notifications.services.requests.post",
            side_effect=requests.exceptions.ConnectionError,
        )

    # ── Suppression produit ────────────────────────────────────────────────

    def test_product_deletion_creates_backoffice_notification(self):
        from apps.core.factories import ProductFactory
        product = ProductFactory(name="Produit test")

        with self._patch_email_succeed():
            product.delete()

        alert = BackofficeNotification.objects.latest("created_at")
        self.assertEqual(alert.kind, BackofficeNotification.Kind.SENSITIVE_ACTION)
        self.assertEqual(alert.severity, BackofficeNotification.Severity.WARNING)
        self.assertIn("Suppression de produit", alert.title)
        self.assertIn("Produit test", alert.message)

    def test_product_deletion_sends_email_to_superadmins(self):
        from apps.core.factories import ProductFactory
        product = ProductFactory(name="Produit mail")

        with self._patch_email_succeed() as mock_post:
            product.delete()

        self.assertTrue(
            Notification.objects.filter(
                event=Notification.Event.SENSITIVE_ACTION,
                recipient_email="alert@example.com",
            ).exists()
        )
        called_payload = mock_post.call_args[1].get("json") or mock_post.call_args[0][1] if len(mock_post.call_args[0]) > 1 else None
        # Le endpoint Resend est bien appelé.
        mock_post.assert_called()

    # ── Suppression commande ───────────────────────────────────────────────

    def test_order_deletion_creates_backoffice_notification(self):
        from apps.core.factories import OrderFactory
        order = OrderFactory(full_name="Client Test", total_xof=2500)

        with self._patch_email_succeed():
            order.delete()

        alert = BackofficeNotification.objects.latest("created_at")
        self.assertEqual(alert.kind, BackofficeNotification.Kind.SENSITIVE_ACTION)
        self.assertIn("Suppression de commande", alert.title)

    # ── Suppression compte staff ───────────────────────────────────────────

    def test_staff_user_deletion_creates_backoffice_notification(self):
        from apps.core.factories import StaffUserFactory
        staff = StaffUserFactory(username="deletedstaff", email="staff@example.com")

        with self._patch_email_succeed():
            staff.delete()

        alert = BackofficeNotification.objects.latest("created_at")
        self.assertEqual(alert.kind, BackofficeNotification.Kind.SENSITIVE_ACTION)
        self.assertIn("Suppression d'un compte staff", alert.title)

    def test_non_staff_user_deletion_does_not_trigger_notification(self):
        from apps.core.factories import UserFactory
        user = UserFactory(username="plainuser", email="plain@example.com")

        with self._patch_email_succeed():
            user.delete()

        self.assertFalse(
            BackofficeNotification.objects.filter(
                kind=BackofficeNotification.Kind.SENSITIVE_ACTION,
            ).exists()
        )

    # ── Changement de permissions ──────────────────────────────────────────

    def test_is_staff_change_creates_backoffice_notification(self):
        from apps.core.factories import StaffUserFactory
        staff = StaffUserFactory(username="permstaff")

        staff.is_staff = False
        with self._patch_email_succeed():
            staff.save()

        alert = BackofficeNotification.objects.latest("created_at")
        self.assertEqual(alert.kind, BackofficeNotification.Kind.SENSITIVE_ACTION)
        self.assertIn("is_staff", alert.title)
        self.assertIn("désactivé", alert.title)

    def test_is_superuser_change_creates_backoffice_notification(self):
        from apps.core.factories import SuperUserFactory
        su = SuperUserFactory(username="permadmin")

        su.is_superuser = False
        with self._patch_email_succeed():
            su.save()

        alert = BackofficeNotification.objects.latest("created_at")
        self.assertEqual(alert.kind, BackofficeNotification.Kind.SENSITIVE_ACTION)
        self.assertIn("is_superuser", alert.title)

    def test_groups_change_creates_backoffice_notification(self):
        from django.contrib.auth.models import Group
        from apps.core.factories import StaffUserFactory
        group = Group.objects.create(name="Test Group")
        staff = StaffUserFactory(username="groupstaff")

        with self._patch_email_succeed():
            staff.groups.add(group)

        alert = BackofficeNotification.objects.latest("created_at")
        self.assertEqual(alert.kind, BackofficeNotification.Kind.SENSITIVE_ACTION)
        self.assertIn("groupes modifiés", alert.title)

    def test_no_change_on_save_does_not_trigger_notification(self):
        from apps.core.factories import StaffUserFactory
        staff = StaffUserFactory(username="noopstaff")

        with self._patch_email_succeed():
            staff.save()

        self.assertFalse(
            BackofficeNotification.objects.filter(
                kind=BackofficeNotification.Kind.SENSITIVE_ACTION,
            ).exists()
        )

    # ── Changement de prix produit ─────────────────────────────────────────

    def test_product_price_change_creates_backoffice_notification(self):
        from apps.core.factories import ProductFactory
        product = ProductFactory(name="Produit prix", price_xof=5000)

        product.price_xof = 7500
        with self._patch_email_succeed():
            product.save()

        alert = BackofficeNotification.objects.latest("created_at")
        self.assertEqual(alert.kind, BackofficeNotification.Kind.SENSITIVE_ACTION)
        self.assertIn("Changement de prix", alert.title)
        self.assertIn("5000", alert.message)
        self.assertIn("7500", alert.message)

    def test_product_price_change_sends_email_to_superadmins(self):
        from apps.core.factories import ProductFactory
        product = ProductFactory(name="Produit mail", price_xof=1000)

        product.price_xof = 2000
        with self._patch_email_succeed():
            product.save()

        self.assertTrue(
            Notification.objects.filter(
                event=Notification.Event.SENSITIVE_ACTION,
                recipient_email="alert@example.com",
            ).exists()
        )

    def test_product_non_price_field_change_does_not_trigger_notification(self):
        from apps.core.factories import ProductFactory
        product = ProductFactory(name="Produit no price", price_xof=5000)

        product.name = "Produit no price renamed"
        with self._patch_email_succeed():
            product.save()

        self.assertFalse(
            BackofficeNotification.objects.filter(
                kind=BackofficeNotification.Kind.SENSITIVE_ACTION,
            ).exists()
        )
