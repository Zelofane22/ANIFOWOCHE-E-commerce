from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import SellerProfile, Shop

User = get_user_model()


class SellerApiTests(APITestCase):
    def test_seller_register_creates_user_profile_shop_and_tokens(self):
        payload = {
            "username": "vendeuse",
            "email": "vendeuse@example.com",
            "password": "StrongPass123!",
            "password2": "StrongPass123!",
            "display_name": "Afi Boutique",
            "phone": "+22990000000",
            "city": "Cotonou",
            "shop_name": "Afi Wax",
            "shop_slug": "afi-wax",
            "shop_description": "Tissus et accessoires",
        }

        response = self.client.post("/api/seller/register/", payload, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertIn("access", response.data)
        self.assertEqual(response.data["seller"]["display_name"], "Afi Boutique")
        self.assertEqual(response.data["seller"]["shop"]["slug"], "afi-wax")
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(SellerProfile.objects.count(), 1)
        self.assertEqual(Shop.objects.count(), 1)

    def test_seller_register_rejects_duplicate_slug(self):
        user = User.objects.create_user(username="owner", password="pass1234")
        seller = SellerProfile.objects.create(user=user, display_name="Owner", phone="+22990000000")
        Shop.objects.create(seller=seller, name="Afi Wax", slug="afi-wax", whatsapp_phone="+22990000000")

        response = self.client.post(
            "/api/seller/register/",
            {
                "username": "vendeuse",
                "password": "StrongPass123!",
                "password2": "StrongPass123!",
                "display_name": "Afi Boutique",
                "phone": "+22991000000",
                "shop_name": "Afi Wax",
                "shop_slug": "afi-wax",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(User.objects.count(), 1)

    def test_authenticated_seller_can_read_and_update_profile(self):
        user = User.objects.create_user(username="vendeuse", password="pass1234")
        seller = SellerProfile.objects.create(user=user, display_name="Afi Boutique", phone="+22990000000")
        Shop.objects.create(seller=seller, name="Afi Wax", slug="afi-wax", whatsapp_phone="+22990000000")
        self.client.force_authenticate(user=user)

        response = self.client.get("/api/seller/profile/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["shop"]["public_path"], "/shop/afi-wax")

        patch_response = self.client.patch(
            "/api/seller/profile/",
            {
                "display_name": "Afi Seller",
                "city": "Porto-Novo",
                "shop": {"name": "Afi Mode", "city": "Porto-Novo", "description": "Mode femme"},
            },
            format="json",
        )
        self.assertEqual(patch_response.status_code, 200)
        seller.refresh_from_db()
        seller.shop.refresh_from_db()
        self.assertEqual(seller.display_name, "Afi Seller")
        self.assertEqual(seller.shop.name, "Afi Mode")

    def test_public_shop_is_available_by_slug(self):
        user = User.objects.create_user(username="vendeuse", password="pass1234")
        seller = SellerProfile.objects.create(user=user, display_name="Afi Boutique", phone="+22990000000")
        Shop.objects.create(
            seller=seller,
            name="Afi Wax",
            slug="afi-wax",
            whatsapp_phone="+22990000000",
            city="Cotonou",
        )

        response = self.client.get("/api/public/shops/afi-wax/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["name"], "Afi Wax")

    def test_dashboard_requires_authenticated_seller(self):
        response = self.client.get("/api/seller/dashboard/")
        self.assertEqual(response.status_code, 401)
