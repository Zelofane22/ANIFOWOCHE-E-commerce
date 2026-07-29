from django.test import TestCase
from rest_framework.test import APITestCase

from apps.core.factories import BannerFactory, SuperUserFactory


class BannerApiTests(APITestCase):
    def setUp(self):
        self.published_first = BannerFactory(title="Promo bazin", order=1)
        self.published_second = BannerFactory(title="Nouvelle collection", order=2)
        self.unpublished = BannerFactory(title="Brouillon", is_published=False, order=0)

    def test_list_only_returns_published_banners_ordered(self):
        response = self.client.get("/api/content/banners/")
        self.assertEqual(response.status_code, 200)
        titles = [item["title"] for item in response.data["results"]]
        self.assertEqual(titles, ["Promo bazin", "Nouvelle collection"])

    def test_write_actions_are_not_exposed(self):
        self.assertEqual(
            self.client.post("/api/content/banners/", {"title": "Test"}, format="json").status_code, 405
        )
        detail_url = f"/api/content/banners/{self.published_first.id}/"
        self.assertEqual(self.client.patch(detail_url, {"title": "Test"}, format="json").status_code, 405)
        self.assertEqual(self.client.delete(detail_url).status_code, 405)


class BannerAdminTests(TestCase):
    def setUp(self):
        self.admin = SuperUserFactory(username="content-admin")
        self.client.force_login(self.admin)

    def test_banner_changelist(self):
        response = self.client.get("/admin/content/banner/")
        self.assertEqual(response.status_code, 200)

    def test_banner_add_form(self):
        response = self.client.get("/admin/content/banner/add/")
        self.assertEqual(response.status_code, 200)

    def test_non_staff_cannot_access(self):
        from apps.core.factories import UserFactory
        user = UserFactory(username="regular-content")
        self.client.force_login(user)
        response = self.client.get("/admin/content/banner/")
        self.assertEqual(response.status_code, 302)
