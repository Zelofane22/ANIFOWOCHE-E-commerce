import requests
from unittest import mock

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import TestCase

from apps.notifications.models import Notification, NotificationSettings
from apps.payments.models import PaymentSettings

from .models import SettingChangeRequest, StoreSettings
from .services import approve_setting_change, process_new_request, reject_setting_change

User = get_user_model()


class SettingChangeRequestServiceTests(TestCase):
    """Sprint 6 : chaque coupure (paiement en ligne, moyen de paiement,
    maintenance) doit être justifiée et validée par un superadmin ; réactiver
    (le sens sûr) s'applique tout de suite, sans validation."""

    def setUp(self):
        self.superuser = User.objects.create_superuser(
            username="root", password="pass1234", email="root@anifowoche.example"
        )
        self.staff_user = User.objects.create_user(username="staffer", password="pass1234", is_staff=True)

    def test_non_superuser_request_to_disable_stays_pending_and_notifies_superusers(self):
        change_request = SettingChangeRequest.objects.create(
            setting_key=SettingChangeRequest.SettingKey.PAYMENT_METHOD_MTN,
            target_value=False,
            reason="MTN API instable ce matin",
            requested_by=self.staff_user,
        )
        with mock.patch(
            "apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError
        ):
            process_new_request(change_request)

        change_request.refresh_from_db()
        self.assertEqual(change_request.status, SettingChangeRequest.Status.PENDING)
        self.assertTrue(PaymentSettings.get_solo().mtn_enabled)
        self.assertTrue(
            Notification.objects.filter(
                event=Notification.Event.SETTING_CHANGE_REQUESTED, recipient_email=self.superuser.email
            ).exists()
        )

    def test_non_superuser_request_to_re_enable_is_auto_approved(self):
        PaymentSettings.objects.update_or_create(pk=1, defaults={"mtn_enabled": False})
        change_request = SettingChangeRequest.objects.create(
            setting_key=SettingChangeRequest.SettingKey.PAYMENT_METHOD_MTN,
            target_value=True,
            reason="Panne résolue",
            requested_by=self.staff_user,
        )
        process_new_request(change_request)
        change_request.refresh_from_db()
        self.assertEqual(change_request.status, SettingChangeRequest.Status.APPROVED)
        self.assertTrue(PaymentSettings.get_solo().mtn_enabled)

    def test_superuser_request_to_disable_is_auto_approved(self):
        change_request = SettingChangeRequest.objects.create(
            setting_key=SettingChangeRequest.SettingKey.PAYMENT_METHOD_CARD,
            target_value=False,
            reason="Fraude détectée sur ce canal",
            requested_by=self.superuser,
        )
        process_new_request(change_request)
        change_request.refresh_from_db()
        self.assertEqual(change_request.status, SettingChangeRequest.Status.APPROVED)
        self.assertFalse(PaymentSettings.get_solo().card_enabled)

    def test_cannot_disable_last_remaining_payment_method(self):
        """Garde-fou anti-blocage total demandé par l'utilisateur : même un
        superadmin ne peut pas couper le dernier moyen de paiement actif tant
        que le paiement en ligne est lui-même actif."""
        PaymentSettings.objects.update_or_create(
            pk=1, defaults={"mtn_enabled": False, "moov_enabled": False, "card_enabled": True}
        )
        change_request = SettingChangeRequest.objects.create(
            setting_key=SettingChangeRequest.SettingKey.PAYMENT_METHOD_CARD,
            target_value=False,
            reason="Test blocage total",
            requested_by=self.superuser,
        )
        process_new_request(change_request)
        change_request.refresh_from_db()
        self.assertEqual(change_request.status, SettingChangeRequest.Status.REJECTED)
        self.assertIn("aucun moyen de paiement", change_request.review_note.lower())
        self.assertTrue(PaymentSettings.get_solo().card_enabled)

    def test_disabling_online_payment_globally_is_not_blocked_by_the_lockout_guard(self):
        """Couper le paiement en ligne dans son ensemble (repli délibéré sur
        la livraison) reste possible même si 0 moyen de paiement est actif —
        ce n'est pas le blocage accidentel que le garde-fou vise à empêcher."""
        change_request = SettingChangeRequest.objects.create(
            setting_key=SettingChangeRequest.SettingKey.ONLINE_PAYMENT_ENABLED,
            target_value=False,
            reason="Migration vers les clés de production FedaPay en cours",
            requested_by=self.superuser,
        )
        process_new_request(change_request)
        change_request.refresh_from_db()
        self.assertEqual(change_request.status, SettingChangeRequest.Status.APPROVED)
        self.assertFalse(PaymentSettings.get_solo().online_payment_enabled)

    def test_maintenance_mode_enable_is_risky_disable_is_safe(self):
        enable_request = SettingChangeRequest.objects.create(
            setting_key=SettingChangeRequest.SettingKey.MAINTENANCE_MODE,
            target_value=True,
            reason="Rupture de stock générale, on ferme le temps de se réapprovisionner",
            requested_by=self.staff_user,
        )
        process_new_request(enable_request)
        enable_request.refresh_from_db()
        self.assertEqual(enable_request.status, SettingChangeRequest.Status.PENDING)
        self.assertFalse(StoreSettings.get_solo().maintenance_mode)

        approve_setting_change(change_request=enable_request, reviewer=self.superuser, note="Confirmé")
        enable_request.refresh_from_db()
        self.assertEqual(enable_request.status, SettingChangeRequest.Status.APPROVED)
        self.assertTrue(StoreSettings.get_solo().maintenance_mode)

        disable_request = SettingChangeRequest.objects.create(
            setting_key=SettingChangeRequest.SettingKey.MAINTENANCE_MODE,
            target_value=False,
            reason="Stock reconstitué, réouverture",
            requested_by=self.staff_user,
        )
        process_new_request(disable_request)
        disable_request.refresh_from_db()
        self.assertEqual(disable_request.status, SettingChangeRequest.Status.APPROVED)
        self.assertFalse(StoreSettings.get_solo().maintenance_mode)

    def test_reject_setting_change_does_not_apply_it(self):
        change_request = SettingChangeRequest.objects.create(
            setting_key=SettingChangeRequest.SettingKey.PAYMENT_METHOD_MOOV,
            target_value=False,
            reason="Test",
            requested_by=self.staff_user,
        )
        reject_setting_change(change_request=change_request, reviewer=self.superuser, note="Pas nécessaire")
        change_request.refresh_from_db()
        self.assertEqual(change_request.status, SettingChangeRequest.Status.REJECTED)
        self.assertTrue(PaymentSettings.get_solo().moov_enabled)


class SettingChangeRequestAdminTests(TestCase):
    def setUp(self):
        self.superuser = User.objects.create_superuser(username="root2", password="pass1234")
        self.commandes_staff = User.objects.create_user(username="commandes", password="pass1234", is_staff=True)
        self.commandes_staff.groups.add(Group.objects.get(name="Gestion commandes"))
        self.catalogue_staff = User.objects.create_user(username="catalogue", password="pass1234", is_staff=True)
        self.catalogue_staff.groups.add(Group.objects.get(name="Gestion catalogue"))

    def test_gestion_commandes_can_create_a_disable_request_which_stays_pending(self):
        self.client.force_login(self.commandes_staff)
        response = self.client.post(
            "/admin/core/settingchangerequest/add/",
            {"setting_key": "payment_method_mtn", "reason": "MTN instable ce matin"},
            follow=True,
        )
        self.assertEqual(response.status_code, 200)
        change_request = SettingChangeRequest.objects.get(setting_key="payment_method_mtn")
        self.assertEqual(change_request.status, SettingChangeRequest.Status.PENDING)
        self.assertEqual(change_request.requested_by, self.commandes_staff)
        self.assertTrue(PaymentSettings.get_solo().mtn_enabled)

    def test_gestion_catalogue_cannot_create_a_request(self):
        self.client.force_login(self.catalogue_staff)
        response = self.client.get("/admin/core/settingchangerequest/add/")
        self.assertEqual(response.status_code, 403)

    def test_superuser_can_approve_a_pending_request(self):
        change_request = SettingChangeRequest.objects.create(
            setting_key=SettingChangeRequest.SettingKey.PAYMENT_METHOD_CARD,
            target_value=False,
            reason="Suspicion de fraude",
            requested_by=self.commandes_staff,
        )
        self.client.force_login(self.superuser)
        response = self.client.post(
            f"/admin/core/settingchangerequest/{change_request.pk}/change/",
            {"status": SettingChangeRequest.Status.APPROVED, "review_note": "Confirmé avec l'équipe finance"},
            follow=True,
        )
        self.assertEqual(response.status_code, 200)
        change_request.refresh_from_db()
        self.assertEqual(change_request.status, SettingChangeRequest.Status.APPROVED)
        self.assertEqual(change_request.reviewed_by, self.superuser)
        self.assertFalse(PaymentSettings.get_solo().card_enabled)

    def test_superuser_approval_is_auto_rejected_if_it_would_cause_lockout(self):
        PaymentSettings.objects.update_or_create(
            pk=1, defaults={"mtn_enabled": False, "moov_enabled": False, "card_enabled": True}
        )
        change_request = SettingChangeRequest.objects.create(
            setting_key=SettingChangeRequest.SettingKey.PAYMENT_METHOD_CARD,
            target_value=False,
            reason="Test blocage",
            requested_by=self.commandes_staff,
        )
        self.client.force_login(self.superuser)
        self.client.post(
            f"/admin/core/settingchangerequest/{change_request.pk}/change/",
            {"status": SettingChangeRequest.Status.APPROVED, "review_note": ""},
            follow=True,
        )
        change_request.refresh_from_db()
        self.assertEqual(change_request.status, SettingChangeRequest.Status.REJECTED)
        self.assertTrue(PaymentSettings.get_solo().card_enabled)

    def test_non_superuser_cannot_approve_but_can_view_own_pending_request(self):
        change_request = SettingChangeRequest.objects.create(
            setting_key=SettingChangeRequest.SettingKey.PAYMENT_METHOD_MOOV,
            target_value=False,
            reason="Test",
            requested_by=self.commandes_staff,
        )
        self.client.force_login(self.commandes_staff)
        response = self.client.get(f"/admin/core/settingchangerequest/{change_request.pk}/change/")
        self.assertEqual(response.status_code, 200)
        change_request.refresh_from_db()
        self.assertEqual(change_request.status, SettingChangeRequest.Status.PENDING)

        post_response = self.client.post(
            f"/admin/core/settingchangerequest/{change_request.pk}/change/",
            {"status": SettingChangeRequest.Status.APPROVED, "review_note": "j'approuve moi-même"},
            follow=True,
        )
        self.assertIn(post_response.status_code, (403, 200))
        change_request.refresh_from_db()
        self.assertEqual(change_request.status, SettingChangeRequest.Status.PENDING)
        self.assertTrue(PaymentSettings.get_solo().moov_enabled)


class LockedSingletonAdminTests(TestCase):
    """StoreSettings/PaymentSettings ne sont jamais éditables directement,
    même par un superadmin — seule une SettingChangeRequest peut les changer."""

    def setUp(self):
        self.superuser = User.objects.create_superuser(username="root3", password="pass1234")

    def test_superuser_cannot_add_or_change_store_settings_directly(self):
        self.client.force_login(self.superuser)
        self.assertEqual(self.client.get("/admin/core/storesettings/add/").status_code, 403)
        obj = StoreSettings.get_solo()
        response = self.client.post(f"/admin/core/storesettings/{obj.pk}/change/", {"maintenance_mode": "on"})
        self.assertEqual(response.status_code, 403)
        self.assertFalse(StoreSettings.get_solo().maintenance_mode)

    def test_superuser_cannot_add_or_change_payment_settings_directly(self):
        self.client.force_login(self.superuser)
        self.assertEqual(self.client.get("/admin/payments/paymentsettings/add/").status_code, 403)
        obj = PaymentSettings.get_solo()
        response = self.client.post(f"/admin/payments/paymentsettings/{obj.pk}/change/", {})
        self.assertEqual(response.status_code, 403)
        self.assertTrue(PaymentSettings.get_solo().mtn_enabled)


class SettingsHubAdminTests(TestCase):
    def setUp(self):
        self.superuser = User.objects.create_superuser(username="root4", password="pass1234")

    def test_superuser_can_open_the_settings_hub(self):
        PaymentSettings.objects.update_or_create(pk=1, defaults={"card_enabled": False})
        NotificationSettings.objects.update_or_create(pk=1, defaults={"whatsapp_enabled": True})
        SettingChangeRequest.objects.create(
            setting_key=SettingChangeRequest.SettingKey.PAYMENT_METHOD_CARD,
            target_value=True,
            reason="Réactivation carte",
            requested_by=self.superuser,
        )

        self.client.force_login(self.superuser)
        response = self.client.get("/admin/reglages/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Réglages boutique")
        self.assertContains(response, "Paiement en ligne")
        self.assertContains(response, "WhatsApp")
        self.assertContains(response, "Demandes de changement")


class StoreStatusViewTests(TestCase):
    def test_returns_current_effective_state(self):
        PaymentSettings.objects.update_or_create(pk=1, defaults={"card_enabled": False})
        response = self.client.get("/api/store/status/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "maintenance_mode": False,
                "online_payment_enabled": True,
                "payment_methods": {"mtn": True, "moov": True, "card": False},
            },
        )
