from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

User = get_user_model()


class AuthApiTests(APITestCase):
    def test_register_returns_tokens_and_user(self):
        payload = {
            "username": "nouveau",
            "email": "nouveau@example.com",
            "password": "SuperSecret123!",
            "password2": "SuperSecret123!",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["username"], "nouveau")

    def test_register_rejects_password_mismatch(self):
        payload = {
            "username": "nouveau2",
            "email": "nouveau2@example.com",
            "password": "SuperSecret123!",
            "password2": "autrechose",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, 400)

    def test_register_rejects_duplicate_email(self):
        User.objects.create_user(username="existant", email="dup@example.com", password="SuperSecret123!")
        payload = {
            "username": "autre",
            "email": "dup@example.com",
            "password": "SuperSecret123!",
            "password2": "SuperSecret123!",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, 400)

    def test_login_and_me(self):
        User.objects.create_user(username="loginuser", password="SuperSecret123!")
        login_response = self.client.post(
            "/api/auth/token/", {"username": "loginuser", "password": "SuperSecret123!"}, format="json"
        )
        self.assertEqual(login_response.status_code, 200)
        access = login_response.data["access"]

        me_response = self.client.get("/api/auth/me/", HTTP_AUTHORIZATION=f"Bearer {access}")
        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.data["username"], "loginuser")

    def test_me_requires_authentication(self):
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, 401)
