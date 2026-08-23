import tempfile
from datetime import timedelta
import requests
from unittest import mock

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from apps.analytics.models import PageView
from apps.core.management.commands import seed_e2e
from apps.delivery.models import DeliverySlot, DeliveryZone
from apps.products.models import Category, Product

from apps.orders.models import Order
from apps.sellers.models import SellerSubscription, SellerProfile

from apps.core.factories import (
    CategoryFactory,
    ShopFactory,
    OrderFactory,
    OrderItemFactory,
    SettingChangeRequestFactory,
    ProductFactory,
    StaffUserFactory,
    SuperUserFactory,
    UserFactory,
)
from apps.notifications.models import Notification, NotificationSettings
from apps.payments.models import PaymentSettings

from .models import SettingChangeRequest, StoreSettings
from .dashboard import dashboard_callback
from .services import approve_setting_change, process_new_request, reject_setting_change

User = get_user_model()


class SettingChangeRequestServiceTests(TestCase):
    def setUp(self):
        self.superuser = SuperUserFactory(
            username="root", email="root@anifowoche.example"
        )
        self.staff_user = StaffUserFactory(username="staffer")

    def test_non_superuser_request_to_disable_stays_pending_and_notifies_superusers(self):
        change_request = SettingChangeRequestFactory(
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
        change_request = SettingChangeRequestFactory(
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
        change_request = SettingChangeRequestFactory(
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
        PaymentSettings.objects.update_or_create(
            pk=1, defaults={"mtn_enabled": False, "moov_enabled": False, "card_enabled": True}
        )
        change_request = SettingChangeRequestFactory(
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
        change_request = SettingChangeRequestFactory(
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
        enable_request = SettingChangeRequestFactory(
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

        disable_request = SettingChangeRequestFactory(
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
        change_request = SettingChangeRequestFactory(
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
        self.superuser = SuperUserFactory(username="root2")
        self.commandes_staff = StaffUserFactory(username="commandes")
        self.commandes_staff.groups.add(Group.objects.get(name="Gestion commandes"))
        self.catalogue_staff = StaffUserFactory(username="catalogue")
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
        change_request = SettingChangeRequestFactory(
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
        change_request = SettingChangeRequestFactory(
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
        change_request = SettingChangeRequestFactory(
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
    def setUp(self):
        self.superuser = SuperUserFactory(username="root3")

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
        self.superuser = SuperUserFactory(username="root4")

    def test_superuser_can_open_the_settings_hub(self):
        PaymentSettings.objects.update_or_create(pk=1, defaults={"card_enabled": False})
        NotificationSettings.objects.update_or_create(pk=1, defaults={"whatsapp_enabled": True})
        SettingChangeRequestFactory(
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
        self.assertContains(response, "Mobile Money")
        self.assertContains(response, "Carte bancaire")
        self.assertContains(response, "Paiement à la livraison")
        self.assertNotContains(response, "MTN Mobile Money")
        self.assertNotContains(response, "Moov Money")
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
                "payment_methods": {"mtn": True, "moov": True, "card": False, "cash_on_delivery": True},
            },
        )


class SettingsHubPaymentCardTests(TestCase):
    def setUp(self):
        self.superuser = SuperUserFactory(
            username="root",
            email="root@anifowoche.example",
        )
        self.superuser.set_password("pass12345")
        self.superuser.save()

    def test_online_methods_look_inactive_when_online_payment_is_disabled(self):
        PaymentSettings.objects.update_or_create(
            pk=1,
            defaults={
                "online_payment_enabled": False,
                "mtn_enabled": True,
                "moov_enabled": True,
                "card_enabled": True,
            },
        )
        self.client.force_login(self.superuser)

        response = self.client.get("/admin/reglages/")

        self.assertEqual(response.status_code, 200)
        html = response.content.decode()
        payments_card = html.split('<div class="anw-settings-card-title">Paiements</div>', 1)[1].split(
            '<div class="anw-actions">',
            1,
        )[0]
        self.assertIn('<span class="anw-settings-label">Paiement en ligne</span>', payments_card)
        self.assertIn('<span class="anw-settings-label">Mobile Money</span>', payments_card)
        self.assertIn('<span class="anw-settings-label">Carte bancaire</span>', payments_card)
        self.assertIn('<span class="anw-settings-label">Paiement à la livraison</span>', payments_card)
        self.assertEqual(payments_card.count("anw-status-off"), 3)
        self.assertEqual(payments_card.count("anw-status-on"), 1)


class SeedE2ECommandTests(TestCase):
    """La commande seed_e2e crée les données attendues et reste idempotente."""

    def setUp(self):
        # Les images générées par le seed ne doivent pas polluer le vrai MEDIA_ROOT.
        self._media_override = override_settings(MEDIA_ROOT=tempfile.mkdtemp())
        self._media_override.enable()
        self.addCleanup(self._media_override.disable)

    def test_seed_creates_expected_e2e_data(self):
        call_command("seed_e2e")

        client_user = User.objects.get(username=seed_e2e.CLIENT_USERNAME)
        self.assertEqual(client_user.email, seed_e2e.CLIENT_EMAIL)
        self.assertTrue(client_user.check_password(seed_e2e.CLIENT_PASSWORD))
        self.assertEqual(client_user.profile.phone, seed_e2e.CLIENT_PHONE)

        seller_user = User.objects.get(username=seed_e2e.SELLER_USERNAME)
        self.assertTrue(seller_user.check_password(seed_e2e.SELLER_PASSWORD))
        self.assertEqual(seller_user.seller_profile.display_name, seed_e2e.SELLER_DISPLAY_NAME)
        self.assertEqual(seller_user.seller_profile.shop.slug, seed_e2e.SHOP_SLUG)

        category = Category.objects.get(slug=seed_e2e.CATEGORY_SLUG)
        products = Product.objects.filter(category=category)
        self.assertEqual(products.count(), len(seed_e2e.PRODUCTS))
        for product in products:
            self.assertTrue(product.image, "Chaque produit doit avoir une image de couverture.")
            self.assertEqual(product.images.count(), 2)
            self.assertTrue(product.seller_id and product.shop_id)

        self.assertTrue(DeliveryZone.objects.filter(is_active=True).exists())
        self.assertTrue(DeliverySlot.objects.filter(is_active=True).exists())
        self.assertTrue(PaymentSettings.get_solo().cash_on_delivery_enabled)

    def test_seed_is_idempotent(self):
        call_command("seed_e2e")
        call_command("seed_e2e")

        self.assertEqual(User.objects.filter(username=seed_e2e.CLIENT_USERNAME).count(), 1)
        self.assertEqual(User.objects.filter(username=seed_e2e.SELLER_USERNAME).count(), 1)
        self.assertEqual(Category.objects.filter(slug=seed_e2e.CATEGORY_SLUG).count(), 1)
        self.assertEqual(Product.objects.count(), len(seed_e2e.PRODUCTS))
        self.assertEqual(Product.objects.filter(slug=seed_e2e.PRODUCTS[0]["slug"]).count(), 1)


class ReportsAdminTests(TestCase):
    def setUp(self):
        self.superuser = SuperUserFactory(username="reports-admin")
        self.client.force_login(self.superuser)
        self.product = ProductFactory(name="Produit rapport")

    def create_order(self, days_ago, total, status=Order.Status.DELIVERED):
        order = OrderFactory(total_xof=total, status=status)
        created_at = timezone.now() - timedelta(days=days_ago)
        Order.objects.filter(pk=order.pk).update(created_at=created_at)
        OrderItemFactory(order=order, product=self.product, quantity=1, unit_price_xof=total)
        return order

    def test_reports_filter_period_and_show_comparison(self):
        self.create_order(2, 2500)
        self.create_order(10, 1000)
        response = self.client.get("/admin/rapports/?period=7")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["revenue"], 2500)
        self.assertEqual(len(response.context["revenue_by_month"]), 1)
        self.assertContains(response, "7 jours")

    def test_reports_support_custom_period_and_csv_export(self):
        self.create_order(2, 2500)
        response = self.client.get("/admin/rapports/?period=custom&start=2020-01-01&end=2030-01-01&export=csv")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/csv; charset=utf-8")
        self.assertIn("Produit rapport", response.content.decode())
        self.assertIn("attachment; filename=rapports-20200101-20300101.csv", response["Content-Disposition"])


class DashboardStoreScopeTests(TestCase):
    """Les statistiques du dashboard admin ne concernent que la boutique principale."""

    def setUp(self):
        self.superuser = SuperUserFactory(username="dashboard-admin")
        self.client.force_login(self.superuser)
        self.main_shop = ShopFactory(name="Ets ANIFOWOCHE", slug="ets-anifowoche", is_official=True)
        self.other_shop = ShopFactory(name="Les Douceurs de Tinouke", slug="les-douceurs-de-tinouke")
        self.category = CategoryFactory(name="Mode")

        self.main_product = ProductFactory(
            category=self.category, shop=self.main_shop, is_active=True, price_xof=5000, stock=20
        )
        self.other_product = ProductFactory(
            category=self.category, shop=self.other_shop, is_active=True, price_xof=8000, stock=20
        )

        self.main_order = OrderFactory(customer=UserFactory(), total_xof=5000)
        OrderItemFactory(order=self.main_order, product=self.main_product, quantity=1, unit_price_xof=5000)

        self.other_order = OrderFactory(customer=UserFactory(), total_xof=8000)
        OrderItemFactory(order=self.other_order, product=self.other_product, quantity=1, unit_price_xof=8000)

    def test_dashboard_kpis_are_scoped_to_main_shop(self):
        context = dashboard_callback(mock.Mock(), {})

        self.assertEqual(context["kpi_orders"], 1)
        self.assertEqual(context["kpi_revenue"], 5000)
        self.assertEqual(context["kpi_products"], 1)
        # Les comptes non-staff sont plateforme (pas de boutique) : les 2
        # vendeurs des boutiques et les 2 clients des commandes comptent.
        self.assertEqual(context["kpi_clients"], 4)
        self.assertEqual(list(context["recent_orders"]), [self.main_order])
        self.assertEqual(len(context["top_products"]), 1)
        self.assertEqual(context["top_products"][0]["product__name"], self.main_product.name)
        self.assertEqual(context["category_breakdown"][0]["name"], self.category.name)
        self.assertEqual(context["category_breakdown"][0]["total"], 5000)

    def test_dashboard_platform_kpis_exclude_official_shop_and_group_by_plan(self):
        context = dashboard_callback(mock.Mock(), {})

        # La boutique officielle (self.main_shop) est exclue des métriques plateforme.
        self.assertEqual(context["platform_shops_total"], 1)
        self.assertEqual(context["platform_products_total"], 1)
        self.assertEqual(context["platform_orders_total"], 1)

        plan_counts = {row["plan"]: row["count"] for row in context["platform_shops_by_plan"]}
        self.assertEqual(sum(plan_counts.values()), 1)

    def test_dashboard_activation_rate_requires_five_products_and_three_orders(self):
        activated_seller = self.other_shop.seller
        products = []
        for i in range(5):
            p = ProductFactory(
                category=self.category, shop=self.other_shop, seller=activated_seller,
                is_active=True, price_xof=1000,
            )
            products.append(p)
        # 5 produits actifs + 3 commandes non annulées sur des produits du vendeur.
        for i in range(3):
            order = OrderFactory(customer=UserFactory(), total_xof=1000)
            OrderItemFactory(order=order, product=products[i], quantity=1, unit_price_xof=1000)

        inactive_seller_shop = ShopFactory(name="Boutique inactive", slug="boutique-inactive")
        ProductFactory(
            category=self.category, shop=inactive_seller_shop,
            seller=inactive_seller_shop.seller, is_active=True, price_xof=1000,
        )
        # 1 seul produit, aucune commande : vendeur non activé.

        context = dashboard_callback(mock.Mock(), {})

        self.assertEqual(context["activation_vendors_total"], 2)
        self.assertEqual(context["activation_vendors_activated"], 1)
        self.assertEqual(context["activation_rate"], 50.0)

    def test_dashboard_mrr_arpu_and_churn(self):
        now = timezone.now()

        renewing_seller = self.other_shop.seller
        # Abonnement actif aujourd'hui (couvre period_start et maintenant) : ARPU + MRR.
        SellerSubscription.objects.create(
            seller=renewing_seller,
            plan=SellerProfile.Plan.STARTER,
            amount_xof=5000,
            status=SellerSubscription.Status.APPROVED,
            starts_at=now - timedelta(days=5),
            ends_at=now + timedelta(days=25),
        )

        churned_shop = ShopFactory(name="Boutique churn", slug="boutique-churn")
        churned_seller = churned_shop.seller
        # Abonnement expiré il y a 5 jours, non renouvelé : compte dans le churn.
        SellerSubscription.objects.create(
            seller=churned_seller,
            plan=SellerProfile.Plan.STARTER,
            amount_xof=5000,
            status=SellerSubscription.Status.APPROVED,
            starts_at=now - timedelta(days=35),
            ends_at=now - timedelta(days=5),
        )

        context = dashboard_callback(mock.Mock(), {})

        self.assertEqual(context["mrr"], 5000)
        self.assertIsNotNone(context["churn_rate"])
        self.assertEqual(context["churned_vendors_count"], 1)


    def test_dashboard_low_stock_scoped_to_main_shop(self):
        ProductFactory(
            category=self.category, shop=self.other_shop, is_active=True, price_xof=1000, stock=3
        )
        context = dashboard_callback(mock.Mock(), {})

        self.assertEqual(context["low_stock_count"], 0)
        self.assertEqual(len(context["low_stock_products"]), 0)

    def test_reports_scoped_to_main_shop(self):
        response = self.client.get(reverse("admin_reports"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["order_count"], 1)
        self.assertEqual(response.context["revenue"], 5000)
        self.assertEqual(response.context["total_products"], 1)
        self.assertEqual(len(response.context["top_products"]), 1)
        self.assertEqual(response.context["top_products"][0]["product__name"], self.main_product.name)

    def test_admin_index_renders_scoped_kpis(self):
        PageView.objects.create(path="/", session_key="s1")
        PageView.objects.create(path="/shop/les-douceurs-de-tinouke/", session_key="s2")

        response = self.client.get("/admin/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["kpi_revenue"], 5000)
        self.assertEqual(response.context["kpi_orders"], 1)
        self.assertEqual(response.context["kpi_products"], 1)
        self.assertEqual(response.context["kpi_clients"], 4)
        self.assertEqual(response.context["kpi_visits"], 1)

    def test_main_shop_slug_is_configurable(self):
        # Basculer l'officialité sur la deuxième boutique pour vérifier
        # que le dashboard suit bien le flag is_official.
        self.main_shop.is_official = False
        self.main_shop.save()
        self.other_shop.is_official = True
        self.other_shop.save()
        context = dashboard_callback(mock.Mock(), {})

        self.assertEqual(context["kpi_orders"], 1)
        self.assertEqual(context["kpi_revenue"], 8000)
        self.assertEqual(context["kpi_products"], 1)
        # Les comptes clients sont plateforme (pas de boutique) : les 2
        # vendeurs des boutiques et les 2 clients des commandes comptent.
        self.assertEqual(context["kpi_clients"], 4)

    def test_dashboard_kpi_clients_counts_clients_without_orders(self):
        """Régression : un client inscrit sans commande doit compter dans le KPI."""
        UserFactory(username="client-sans-commande")

        context = dashboard_callback(mock.Mock(), {})

        # 4 comptes non-staff du setUp + 1 client inscrit sans commande.
        self.assertEqual(context["kpi_clients"], 5)
