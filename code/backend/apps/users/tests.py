from unittest import mock

import requests
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APITestCase

from apps.core.factories import ProfileFactory, UserFactory
from apps.notifications.services import NotificationDeliveryError

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
        UserFactory(username="existant", email="dup@example.com")
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
        user = UserFactory(username="loginuser")
        user.set_password("SuperSecret123!")
        user.save()
        login_response = self.client.post(
            "/api/auth/token/", {"username": "loginuser", "password": "SuperSecret123!"}, format="json"
        )
        self.assertEqual(login_response.status_code, 200)
        access = login_response.data["access"]

        me_response = self.client.get("/api/auth/me/", HTTP_AUTHORIZATION=f"Bearer {access}")
        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.data["username"], "loginuser")

    def test_login_with_email(self):
        user = UserFactory(username="loginemail", email="loginemail@example.com")
        user.set_password("SuperSecret123!")
        user.save()
        login_response = self.client.post(
            "/api/auth/token/",
            {"username": "loginemail@example.com", "password": "SuperSecret123!"},
            format="json",
        )
        self.assertEqual(login_response.status_code, 200)

    def test_login_with_phone(self):
        user = UserFactory(username="loginphone")
        user.set_password("SuperSecret123!")
        user.save()
        ProfileFactory(user=user, phone="+2290191112233")
        login_response = self.client.post(
            "/api/auth/token/",
            {"username": "+2290191112233", "password": "SuperSecret123!"},
            format="json",
        )
        self.assertEqual(login_response.status_code, 200)

    def test_login_with_phone_ignores_spacing_differences(self):
        user = UserFactory(username="loginphone2")
        user.set_password("SuperSecret123!")
        user.save()
        ProfileFactory(user=user, phone="+2290191112233")
        login_response = self.client.post(
            "/api/auth/token/",
            {"username": "+229 91 11 22 33", "password": "SuperSecret123!"},
            format="json",
        )
        self.assertEqual(login_response.status_code, 200)

    def test_login_rejects_wrong_password_for_email(self):
        user = UserFactory(username="loginemail2", email="loginemail2@example.com")
        user.set_password("SuperSecret123!")
        user.save()
        login_response = self.client.post(
            "/api/auth/token/",
            {"username": "loginemail2@example.com", "password": "WrongPassword!"},
            format="json",
        )
        self.assertEqual(login_response.status_code, 401)

    def test_me_requires_authentication(self):
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, 401)

    def test_me_defaults_gracefully_for_user_without_profile(self):
        user = UserFactory(username="sansprofil")
        user.set_password("SuperSecret123!")
        user.save()
        login_response = self.client.post(
            "/api/auth/token/", {"username": "sansprofil", "password": "SuperSecret123!"}, format="json"
        )
        access = login_response.data["access"]

        me_response = self.client.get("/api/auth/me/", HTTP_AUTHORIZATION=f"Bearer {access}")
        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.data["notification_channel"], "email")
        self.assertEqual(me_response.data["phone"], "")

    def test_register_defaults_to_email_channel(self):
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
            "phone": "+2290191112233",
            "notification_channel": "email",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["user"]["notification_channel"], "email")
        self.assertEqual(response.data["user"]["phone"], "+2290191112233")
        profile = Profile.objects.get(user__username="avecpref")
        self.assertEqual(profile.notification_channel, Profile.NotificationChannel.EMAIL)
        self.assertEqual(profile.phone, "+2290191112233")

    @mock.patch("apps.users.views.ResendClient.send_email", return_value="resend-reset-id")
    def test_password_reset_request_sends_link_without_exposing_account_lookup(self, mock_send_email):
        user = UserFactory(username="resetuser", email="reset@example.com")
        user.set_password("OldSecret123!")
        user.save()

        response = self.client.post("/api/auth/password-reset/", {"email": "reset@example.com"}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(mock_send_email.call_count, 1)
        self.assertIn("reset_uid=", mock_send_email.call_args.kwargs["html"])
        self.assertIn("reset_token=", mock_send_email.call_args.kwargs["html"])

        response = self.client.post("/api/auth/password-reset/", {"email": "absent@example.com"}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(mock_send_email.call_count, 1)

    @mock.patch(
        "apps.users.views.ResendClient.send_email",
        side_effect=NotificationDeliveryError("Resend indisponible"),
    )
    def test_password_reset_request_returns_generic_success_when_email_delivery_fails(self, mock_send_email):
        user = UserFactory(username="resetfail", email="resetfail@example.com")
        user.set_password("OldSecret123!")
        user.save()

        response = self.client.post("/api/auth/password-reset/", {"email": "resetfail@example.com"}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertIn("Si un compte actif correspond", response.data["detail"])
        self.assertEqual(mock_send_email.call_count, 1)

    def test_password_reset_confirm_updates_password(self):
        user = UserFactory(username="resetconfirm", email="confirm@example.com")
        user.set_password("OldSecret123!")
        user.save()
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
