from django.test import TestCase

from .models import HomeSection, SiteTheme


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
    def test_ensure_defaults_creates_four_ordered_sections(self):
        HomeSection.ensure_defaults()
        sections = list(HomeSection.objects.all())
        self.assertEqual(len(sections), 4)
        self.assertEqual(
            [s.section_type for s in sections],
            [
                HomeSection.SectionType.HERO,
                HomeSection.SectionType.TRUST,
                HomeSection.SectionType.CATEGORIES,
                HomeSection.SectionType.FEATURED,
            ],
        )

    def test_ensure_defaults_is_idempotent(self):
        HomeSection.ensure_defaults()
        HomeSection.ensure_defaults()
        self.assertEqual(HomeSection.objects.count(), 4)


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
