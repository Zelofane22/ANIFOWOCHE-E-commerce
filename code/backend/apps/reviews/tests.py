from django.test import TestCase
from rest_framework.test import APITestCase

from apps.core.factories import CategoryFactory, ProductFactory, ReviewFactory


class ReviewApiTests(APITestCase):
    def setUp(self):
        self.category = CategoryFactory(name="Tissus", slug="tissus")
        self.product = ProductFactory(
            category=self.category, name="Pagne wax", slug="pagne-wax", price_xof=5000, stock=10
        )
        self.approved = ReviewFactory(
            product=self.product, author_name="Awa", rating=5, comment="Très beau tissu", is_approved=True
        )
        self.pending = ReviewFactory(
            product=self.product, author_name="Koffi", rating=3, comment="Correct", is_approved=False
        )

    def test_list_only_returns_approved_reviews(self):
        response = self.client.get("/api/reviews/", {"product__slug": "pagne-wax"})
        self.assertEqual(response.status_code, 200)
        authors = [item["author_name"] for item in response.data["results"]]
        self.assertIn("Awa", authors)
        self.assertNotIn("Koffi", authors)

    def test_anyone_can_submit_a_review(self):
        response = self.client.post(
            "/api/reviews/",
            {"product_id": self.product.id, "author_name": "Chidi", "rating": 4, "comment": "Bien"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        from .models import Review

        review = Review.objects.get(author_name="Chidi")
        self.assertFalse(review.is_approved)

    def test_submitted_review_ignores_client_supplied_is_approved(self):
        response = self.client.post(
            "/api/reviews/",
            {
                "product_id": self.product.id,
                "author_name": "Malicious",
                "rating": 5,
                "comment": "Essai",
                "is_approved": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        from .models import Review

        review = Review.objects.get(author_name="Malicious")
        self.assertFalse(review.is_approved)

    def test_update_and_delete_are_not_exposed(self):
        detail_url = f"/api/reviews/{self.approved.id}/"
        self.assertEqual(self.client.patch(detail_url, {"rating": 1}, format="json").status_code, 405)
        self.assertEqual(self.client.delete(detail_url).status_code, 405)

    def test_product_endpoint_exposes_real_rating_average_and_count(self):
        response = self.client.get("/api/products/pagne-wax/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["review_count"], 1)
        self.assertEqual(response.data["rating_average"], 5.0)


class ReviewAdminTests(TestCase):
    def setUp(self):
        from apps.core.factories import SuperUserFactory
        self.admin = SuperUserFactory(username="review-admin")
        self.client.force_login(self.admin)

    def test_review_changelist(self):
        response = self.client.get("/admin/reviews/review/")
        self.assertEqual(response.status_code, 200)

    def test_review_add_form(self):
        response = self.client.get("/admin/reviews/review/add/")
        self.assertEqual(response.status_code, 200)

    def test_non_staff_cannot_access(self):
        from apps.core.factories import UserFactory
        user = UserFactory(username="regular-reviews")
        self.client.force_login(user)
        response = self.client.get("/admin/reviews/review/")
        self.assertEqual(response.status_code, 302)
