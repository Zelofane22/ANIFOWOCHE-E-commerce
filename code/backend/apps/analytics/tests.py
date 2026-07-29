from django.test import TestCase, Client
from rest_framework.test import APIClient

from .models import PageView
from .serializers import PageViewSerializer


class PageViewModelTests(TestCase):
    """Tests unitaires pour le modèle PageView."""

    def test_create_pageview(self):
        pv = PageView.objects.create(path="/", session_key="abc123")
        self.assertEqual(pv.path, "/")
        self.assertEqual(pv.session_key, "abc123")
        self.assertEqual(pv.referrer, "")
        self.assertIsNotNone(pv.created_at)

    def test_str(self):
        pv = PageView.objects.create(path="/products", session_key="xyz")
        self.assertIn("/products", str(pv))

    def test_ordering_by_created_at_desc(self):
        pv1 = PageView.objects.create(path="/a", session_key="s1")
        pv2 = PageView.objects.create(path="/b", session_key="s2")
        qs = list(PageView.objects.all())
        self.assertEqual(qs[0].pk, pv2.pk)
        self.assertEqual(qs[1].pk, pv1.pk)

    def test_referrer_blank_default(self):
        pv = PageView.objects.create(path="/", session_key="s")
        self.assertEqual(pv.referrer, "")


class PageViewApiTests(TestCase):
    """Tests API pour l'enregistrement de vues de page."""

    def setUp(self):
        self.client = APIClient()

    def test_create_pageview_returns_201(self):
        response = self.client.post(
            "/api/analytics/pageview/",
            {"path": "/", "session_key": "abc123"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(PageView.objects.count(), 1)
        self.assertEqual(PageView.objects.get().path, "/")

    def test_create_pageview_with_referrer(self):
        response = self.client.post(
            "/api/analytics/pageview/",
            {"path": "/products", "session_key": "abc", "referrer": "https://google.com"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(PageView.objects.get().referrer, "https://google.com")

    def test_create_pageview_missing_path_returns_400(self):
        response = self.client.post(
            "/api/analytics/pageview/",
            {"session_key": "abc"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_create_pageview_missing_session_key_returns_400(self):
        response = self.client.post(
            "/api/analytics/pageview/",
            {"path": "/"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_unauthenticated_user_can_create_pageview(self):
        """permission_classes = AllowAny — anonymous should work."""
        response = self.client.post(
            "/api/analytics/pageview/",
            {"path": "/test", "session_key": "anon123"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)


class PageViewAdminTests(TestCase):
    """Tests admin pour PageView."""

    def setUp(self):
        from apps.core.factories import SuperUserFactory
        self.admin = SuperUserFactory(username="analytics-admin")

    def test_changelist_returns_200(self):
        self.client.force_login(self.admin)
        response = self.client.get("/admin/analytics/pageview/")
        self.assertEqual(response.status_code, 200)

    def test_cannot_add_pageview(self):
        self.client.force_login(self.admin)
        response = self.client.get("/admin/analytics/pageview/add/")
        self.assertEqual(response.status_code, 403)

    def test_cannot_change_pageview(self):
        pv = PageView.objects.create(path="/", session_key="s")
        self.client.force_login(self.admin)
        response = self.client.get(f"/admin/analytics/pageview/{pv.pk}/change/")
        self.assertIn(response.status_code, (200, 403))

    def test_non_staff_cannot_access_admin(self):
        from apps.core.factories import UserFactory
        user = UserFactory(username="regular")
        self.client.force_login(user)
        response = self.client.get("/admin/analytics/pageview/")
        self.assertEqual(response.status_code, 302)  # redirect to login
