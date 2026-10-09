from django.test import TestCase
from rest_framework.test import APITestCase

from apps.core.factories import StaffUserFactory, SuperUserFactory, UserFactory

from .models import AppearanceVersion, FooterBlock, HomeSection, MenuItem, SiteTheme


class SiteThemeSingletonTests(TestCase):
    def test_get_solo_always_returns_pk_1(self):
        theme = SiteTheme.get_solo()
        self.assertEqual(theme.pk, 1)
        theme.site_name = "Autre"
        theme.save()
        self.assertEqual(SiteTheme.objects.count(), 1)
        self.assertEqual(SiteTheme.get_solo().pk, 1)

    def test_delete_is_noop(self):
        theme = SiteTheme.get_solo()
        theme.delete()
        self.assertTrue(SiteTheme.objects.filter(pk=1).exists())


class HomeSectionDefaultsTests(TestCase):
    def test_ensure_defaults_creates_three_ordered_sections(self):
        HomeSection.ensure_defaults()
        sections = list(HomeSection.objects.all())
        self.assertEqual(len(sections), 3)
        self.assertEqual(
            [s.section_type for s in sections],
            [
                HomeSection.SectionType.TRUST,
                HomeSection.SectionType.CATEGORIES,
                HomeSection.SectionType.FEATURED,
            ],
        )

    def test_ensure_defaults_is_idempotent(self):
        HomeSection.ensure_defaults()
        HomeSection.ensure_defaults()
        self.assertEqual(HomeSection.objects.count(), 3)


class AppearanceAdminTests(TestCase):
    def setUp(self):
        from apps.core.factories import SuperUserFactory
        self.admin = SuperUserFactory(username="appearance-admin")
        self.client.force_login(self.admin)

    def test_sitetheme_changelist(self):
        response = self.client.get("/admin/appearance/sitetheme/")
        self.assertEqual(response.status_code, 200)

    def test_sitetheme_add_when_none_exists(self):
        SiteTheme.objects.all().delete()
        response = self.client.get("/admin/appearance/sitetheme/add/")
        self.assertEqual(response.status_code, 200)

    def test_homesection_changelist(self):
        response = self.client.get("/admin/appearance/homesection/")
        self.assertEqual(response.status_code, 200)

    def test_homesection_cannot_add(self):
        response = self.client.get("/admin/appearance/homesection/add/")
        self.assertEqual(response.status_code, 403)

    def test_non_staff_cannot_access(self):
        from apps.core.factories import UserFactory
        user = UserFactory(username="regular-appearance")
        self.client.force_login(user)
        response = self.client.get("/admin/appearance/sitetheme/")
        self.assertEqual(response.status_code, 302)


class MenuItemModelTests(TestCase):
    def test_create_and_str(self):
        item = MenuItem.objects.create(label="Catalogue", url="/catalogue", order=1)
        self.assertEqual(str(item), "Catalogue")

    def test_default_ordering(self):
        MenuItem.objects.create(label="B", url="/b", order=2)
        MenuItem.objects.create(label="A", url="/a", order=1)
        items = list(MenuItem.objects.values_list("label", flat=True))
        self.assertEqual(items, ["A", "B"])


class FooterBlockModelTests(TestCase):
    def test_create_and_str(self):
        block = FooterBlock.objects.create(
            title="Boutique",
            items=[{"label": "Catalogue", "url": "/catalogue"}],
            order=0,
        )
        self.assertEqual(str(block), "Boutique")

    def test_items_json(self):
        items = [{"label": "A", "url": "/a"}, {"label": "B", "url": "/b"}]
        block = FooterBlock.objects.create(title="Col", items=items, order=0)
        block.refresh_from_db()
        self.assertEqual(block.items, items)


class MenuItemAdminTests(TestCase):
    def setUp(self):
        from apps.core.factories import SuperUserFactory
        self.admin = SuperUserFactory(username="menu-admin")
        self.client.force_login(self.admin)

    def test_changelist(self):
        response = self.client.get("/admin/appearance/menuitem/")
        self.assertEqual(response.status_code, 200)

    def test_add(self):
        response = self.client.post(
            "/admin/appearance/menuitem/add/",
            {"label": "Test", "url": "/test", "order": 0, "is_visible": True},
        )
        self.assertEqual(response.status_code, 302)
        self.assertTrue(MenuItem.objects.filter(label="Test").exists())


class FooterBlockAdminTests(TestCase):
    def setUp(self):
        from apps.core.factories import SuperUserFactory
        self.admin = SuperUserFactory(username="footer-admin")
        self.client.force_login(self.admin)

    def test_changelist(self):
        response = self.client.get("/admin/appearance/footerblock/")
        self.assertEqual(response.status_code, 200)

    def test_add_page_renders(self):
        response = self.client.get("/admin/appearance/footerblock/add/")
        self.assertEqual(response.status_code, 200)

    def test_create_footerblock(self):
        block = FooterBlock.objects.create(
            title="Test", items=[], order=0, is_visible=True
        )
        self.assertEqual(FooterBlock.objects.count(), 1)
        self.assertEqual(block.title, "Test")


class SiteConfigMenuItemsTests(TestCase):
    def test_visible_menu_items_in_config(self):
        MenuItem.objects.create(label="Liens", url="/liens", order=0, is_visible=True)
        MenuItem.objects.create(label="Caché", url="/cache", order=1, is_visible=False)
        response = self.client.get("/api/site-config/")
        self.assertEqual(response.status_code, 200)
        labels = [m["label"] for m in response.data["menu_items"]]
        self.assertIn("Liens", labels)
        self.assertNotIn("Caché", labels)

    def test_visible_footer_blocks_in_config(self):
        FooterBlock.objects.create(
            title="Col1", items=[{"label": "A", "url": "/a"}], order=0, is_visible=True
        )
        FooterBlock.objects.create(
            title="Col2", items=[], order=1, is_visible=False
        )
        response = self.client.get("/api/site-config/")
        self.assertEqual(response.status_code, 200)
        titles = [b["title"] for b in response.data["footer_blocks"]]
        self.assertIn("Col1", titles)
        self.assertNotIn("Col2", titles)


class AppearanceVersionPermissionTests(APITestCase):
    """Seuls les superadmins peuvent gérer/versionner l'apparence (US-54)."""

    def setUp(self):
        self.admin = SuperUserFactory(username="appearance-superadmin")
        self.staff = StaffUserFactory(username="appearance-staff")
        self.user = UserFactory(username="appearance-user")

    def test_non_superadmin_denied(self):
        draft = AppearanceVersion.get_or_create_draft(user=self.admin)
        cases = [
            ("get", "/api/site-config/draft/"),
            ("get", f"/api/site-config/preview/{draft.pk}/"),
            ("get", "/api/site-config/history/"),
            ("put", "/api/site-config/draft/"),
            ("post", "/api/site-config/publish/"),
            ("post", f"/api/site-config/restore/{draft.pk}/"),
        ]
        for method, url in cases:
            for user in (self.staff, self.user):
                self.client.force_authenticate(user=user)
                response = getattr(self.client, method)(url, format="json")
                self.assertEqual(
                    response.status_code,
                    403,
                    f"{method.upper()} {url} devrait être refusé (403) pour un non-superadmin.",
                )

    def test_anonymous_denied(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/site-config/draft/")
        self.assertEqual(response.status_code, 401)


class AppearanceVersionWorkflowTests(APITestCase):
    """Workflow brouillon → prévisualisation → publication → historique/restauration."""

    def setUp(self):
        self.admin = SuperUserFactory(username="appearance-workflow-admin")
        self.client.force_authenticate(user=self.admin)

    def _theme(self, **overrides):
        theme = {
            "site_name": "Nouveau nom",
            "trust_arguments": ["Argument A", "Argument B"],
            "colors": {"brand": "#112233"},
        }
        theme.update(overrides)
        return theme

    def _put_draft(self, **overrides):
        return self.client.put(
            "/api/site-config/draft/",
            {"theme": self._theme(**overrides)},
            format="json",
        )

    def _published_site_names(self):
        return [
            v.theme.get("site_name")
            for v in AppearanceVersion.objects.filter(status=AppearanceVersion.Status.PUBLISHED)
        ]

    def test_modify_draft(self):
        draft_resp = self.client.get("/api/site-config/draft/")
        self.assertEqual(draft_resp.status_code, 200)

        put = self._put_draft(site_name="Brouillon modifié")
        self.assertEqual(put.status_code, 200)
        self.assertEqual(put.data["theme"]["site_name"], "Brouillon modifié")
        self.assertEqual(put.data["theme"]["colors"]["brand"], "#112233")
        # Le brouillon n'impacte pas la config publiée.
        public = self.client.get("/api/site-config/")
        self.assertNotEqual(public.data["theme"]["site_name"], "Brouillon modifié")

    def test_preview_does_not_publish(self):
        draft = AppearanceVersion.get_or_create_draft(user=self.admin)
        self._put_draft(site_name="Aperçu")

        preview = self.client.get(f"/api/site-config/preview/{draft.pk}/")
        self.assertEqual(preview.status_code, 200)
        self.assertEqual(preview.data["theme"]["site_name"], "Aperçu")
        self.assertEqual(preview.data["theme"]["colors"]["brand"], "#112233")

        # Ni publication ni modification de la config live.
        self.assertEqual(
            AppearanceVersion.objects.filter(status=AppearanceVersion.Status.PUBLISHED).count(),
            0,
        )
        public = self.client.get("/api/site-config/")
        self.assertNotEqual(public.data["theme"]["site_name"], "Aperçu")

    def test_publish(self):
        self._put_draft(site_name="Publié")
        response = self.client.post("/api/site-config/publish/", {}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "published")

        self.assertEqual(SiteTheme.get_solo().site_name, "Publié")
        public = self.client.get("/api/site-config/")
        self.assertEqual(public.data["theme"]["site_name"], "Publié")

    def test_publish_creates_history(self):
        self._put_draft(site_name="V1")
        self.client.post("/api/site-config/publish/", {}, format="json")

        history = self.client.get("/api/site-config/history/")
        self.assertEqual(history.status_code, 200)
        published = [v for v in history.data if v["status"] == "published"]
        self.assertEqual(len(published), 1)
        self.assertEqual(published[0]["theme"]["site_name"], "V1")

    def test_restore_creates_new_published_version(self):
        # V1
        self._put_draft(site_name="V1")
        self.client.post("/api/site-config/publish/", {}, format="json")
        # V2
        self._put_draft(site_name="V2")
        self.client.post("/api/site-config/publish/", {}, format="json")
        self.assertEqual(SiteTheme.get_solo().site_name, "V2")

        v1 = next(
            v for v in AppearanceVersion.objects.filter(status=AppearanceVersion.Status.PUBLISHED)
            if v.theme.get("site_name") == "V1"
        )
        count_before = AppearanceVersion.objects.count()

        restore = self.client.post(f"/api/site-config/restore/{v1.pk}/", {}, format="json")
        self.assertEqual(restore.status_code, 201)
        self.assertEqual(restore.data["status"], "published")
        self.assertEqual(SiteTheme.get_solo().site_name, "V1")

        # Restauration = nouvelle version publiée, historique préservé.
        self.assertEqual(AppearanceVersion.objects.count(), count_before + 1)
        self.assertTrue(AppearanceVersion.objects.filter(pk=v1.pk).exists())
        self.assertIn("V1", self._published_site_names())

    def test_site_config_unchanged_before_publish(self):
        initial = self.client.get("/api/site-config/").data
        self._put_draft(site_name="Brouillon non publié")
        after = self.client.get("/api/site-config/").data
        self.assertEqual(initial["theme"]["site_name"], after["theme"]["site_name"])
