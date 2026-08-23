from django.test import TestCase

from .models import FooterBlock, HomeSection, MenuItem, SiteTheme


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
