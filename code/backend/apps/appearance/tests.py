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
