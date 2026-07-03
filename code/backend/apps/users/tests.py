from unittest import mock

import requests
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import Profile

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

    def test_me_defaults_gracefully_for_user_without_profile(self):
        User.objects.create_user(username="sansprofil", password="SuperSecret123!")
        login_response = self.client.post(
            "/api/auth/token/", {"username": "sansprofil", "password": "SuperSecret123!"}, format="json"
        )
        access = login_response.data["access"]

        me_response = self.client.get("/api/auth/me/", HTTP_AUTHORIZATION=f"Bearer {access}")
        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.data["notification_channel"], "whatsapp")
        self.assertEqual(me_response.data["phone"], "")

    def test_register_defaults_to_whatsapp_channel(self):
        payload = {
            "username": "pardefaut",
            "email": "pardefaut@example.com",
            "password": "SuperSecret123!",
            "password2": "SuperSecret123!",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["user"]["notification_channel"], "whatsapp")
        profile = Profile.objects.get(user__username="pardefaut")
        self.assertEqual(profile.notification_channel, Profile.NotificationChannel.WHATSAPP)
        self.assertEqual(profile.phone, "")

    @mock.patch("apps.notifications.services.requests.post", side_effect=requests.exceptions.ConnectionError)
    def test_register_accepts_phone_and_email_channel_preference(self, mock_post):
        payload = {
            "username": "avecpref",
            "email": "avecpref@example.com",
            "password": "SuperSecret123!",
            "password2": "SuperSecret123!",
            "phone": "+22991112233",
            "notification_channel": "email",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["user"]["notification_channel"], "email")
        self.assertEqual(response.data["user"]["phone"], "+22991112233")
        profile = Profile.objects.get(user__username="avecpref")
        self.assertEqual(profile.notification_channel, Profile.NotificationChannel.EMAIL)
        self.assertEqual(profile.phone, "+22991112233")
