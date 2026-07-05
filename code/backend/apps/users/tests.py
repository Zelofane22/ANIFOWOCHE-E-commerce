from unittest import mock

import requests
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APITestCase

from .models import Profile

User = get_user_model()


class AuthApiTests(APITestCase):
    def setUp(self):
        cache.clear()

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

    def test_register_rejects_phone_longer_than_profile_column(self):
        payload = {
            "username": "phoneemail",
            "email": "phoneemail@example.com",
            "password": "SuperSecret123!",
            "password2": "SuperSecret123!",
            "phone": "fouadechitou@gmail.com",
            "notification_channel": "email",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("phone", response.data)
        self.assertFalse(User.objects.filter(username="phoneemail").exists())

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
        self.assertEqual(me_response.data["notification_channel"], "email")
        self.assertEqual(me_response.data["phone"], "")

    def test_register_defaults_to_email_channel(self):
        """WhatsApp reste bloqué par défaut (Sprint 6, voir NotificationSettings)
        tant qu'aucune vraie clé WhatsApp Business API n'est configurée."""
        payload = {
            "username": "pardefaut",
            "email": "pardefaut@example.com",
            "password": "SuperSecret123!",
            "password2": "SuperSecret123!",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["user"]["notification_channel"], "email")
        profile = Profile.objects.get(user__username="pardefaut")
        self.assertEqual(profile.notification_channel, Profile.NotificationChannel.EMAIL)
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

    @mock.patch("apps.users.views.ResendClient.send_email", return_value="resend-reset-id")
    def test_password_reset_request_sends_link_without_exposing_account_lookup(self, mock_send_email):
        User.objects.create_user(username="resetuser", email="reset@example.com", password="OldSecret123!")

        response = self.client.post("/api/auth/password-reset/", {"email": "reset@example.com"}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(mock_send_email.call_count, 1)
        self.assertIn("reset_uid=", mock_send_email.call_args.kwargs["html"])
        self.assertIn("reset_token=", mock_send_email.call_args.kwargs["html"])

        response = self.client.post("/api/auth/password-reset/", {"email": "absent@example.com"}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(mock_send_email.call_count, 1)

    def test_password_reset_confirm_updates_password(self):
        user = User.objects.create_user(username="resetconfirm", email="confirm@example.com", password="OldSecret123!")
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        response = self.client.post(
            "/api/auth/password-reset/confirm/",
            {
                "uid": uid,
                "token": token,
                "password": "NewSecret123!",
                "password2": "NewSecret123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.check_password("NewSecret123!"))
