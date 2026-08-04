"""Seed reproductible pour les tests E2E Playwright (voir docs/ANIFOWOCHE_boutique/tests-e2e.md).

Idempotent : chaque entité est créée uniquement si elle n'existe pas déjà,
la commande peut donc être relancée en CI comme en local sans effet de bord.
Réutilise les factories de apps/core/factories.py.
"""

from io import BytesIO

from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from PIL import Image, ImageDraw

from apps.core.factories import (
    CategoryFactory,
    DeliverySlotFactory,
    DeliveryZoneFactory,
    ProductFactory,
    ProductImageFactory,
    ProfileFactory,
    SellerProfileFactory,
    ShopFactory,
    UserFactory,
)
from apps.delivery.models import DeliverySlot, DeliveryZone
from apps.payments.models import PaymentSettings
from apps.products.models import Category, Product
from apps.sellers.models import Shop
from apps.users.models import Profile

# Identifiants connus des specs Playwright (code/frontend/e2e/).
CLIENT_USERNAME = "client-e2e"
CLIENT_EMAIL = "client@e2e.test"
CLIENT_PASSWORD = "ClientE2E!2026"
CLIENT_PHONE = "+2290197000001"

SELLER_USERNAME = "seller-e2e"
SELLER_EMAIL = "seller@e2e.test"
SELLER_PASSWORD = "SellerE2E!2026"
SELLER_PHONE = "+2290197000002"
SELLER_DISPLAY_NAME = "Vendeur E2E"

CATEGORY_NAME = "Mode E2E"
CATEGORY_SLUG = "mode-e2e"

SHOP_NAME = "Boutique E2E"
SHOP_SLUG = "boutique-e2e"

PRODUCTS = (
    {"name": "Tissu Wax E2E", "slug": "tissu-wax-e2e", "price_xof": 7500, "stock": 25, "color": (220, 38, 38)},
    {"name": "Sac à Main E2E", "slug": "sac-a-main-e2e", "price_xof": 12000, "stock": 15, "color": (37, 99, 235)},
    {"name": "Bonnet E2E", "slug": "bonnet-e2e", "price_xof": 3500, "stock": 40, "color": (22, 163, 74)},
)

ZONES = (
    {"name": "Cotonou Centre", "fee_xof": 1000, "latitude": 6.3654, "longitude": 2.4183},
    {"name": "Akpakpa", "fee_xof": 1500, "latitude": 6.3760, "longitude": 2.4420},
)

SLOTS = (
    {"label": "Matin", "start_time": "08:00", "end_time": "12:00"},
    {"label": "Soir", "start_time": "14:00", "end_time": "19:00"},
)


def _make_png(label, color):
    """Génère une vraie image PNG (rendue par le serveur média en dev)."""
    image = Image.new("RGB", (800, 600), color)
    draw = ImageDraw.Draw(image)
    draw.rectangle([(16, 16), (784, 584)], outline="white", width=6)
    draw.text((32, 32), label, fill="white")
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


class Command(BaseCommand):
    help = "Seed idempotent des données E2E : catégorie/produits, client, seller/boutique, livraison, réglages paiement."

    def handle(self, *args, **options):
        with transaction.atomic():
            self._seed_client()
            seller, shop = self._seed_seller()
            category = self._seed_category()
            self._seed_products(category, seller, shop)
            self._seed_delivery()
            self._seed_payment_settings()
        self.stdout.write(self.style.SUCCESS("Seed E2E terminé."))

    def _seed_client(self):
        user = User.objects.filter(username=CLIENT_USERNAME).first()
        if not user:
            user = UserFactory(username=CLIENT_USERNAME, email=CLIENT_EMAIL, password=CLIENT_PASSWORD)
            self.stdout.write(f"Client '{CLIENT_USERNAME}' créé ({CLIENT_EMAIL}).")
        else:
            self.stdout.write(f"Client '{CLIENT_USERNAME}' déjà présent.")
        if not Profile.objects.filter(user=user).exists():
            ProfileFactory(user=user, phone=CLIENT_PHONE, notification_channel=Profile.NotificationChannel.EMAIL)
            self.stdout.write(f"Profil créé pour '{CLIENT_USERNAME}'.")

    def _seed_seller(self):
        user = User.objects.filter(username=SELLER_USERNAME).first()
        if not user:
            user = UserFactory(username=SELLER_USERNAME, email=SELLER_EMAIL, password=SELLER_PASSWORD)
            self.stdout.write(f"Seller '{SELLER_USERNAME}' créé ({SELLER_EMAIL}).")
        else:
            self.stdout.write(f"Seller '{SELLER_USERNAME}' déjà présent.")

        seller = user.seller_profile if hasattr(user, "seller_profile") else None
        if not seller:
            seller = SellerProfileFactory(user=user, display_name=SELLER_DISPLAY_NAME, phone=SELLER_PHONE)
            self.stdout.write(f"Profil seller créé pour '{SELLER_USERNAME}'.")

        shop = getattr(seller, "shop", None)
        if not shop:
            shop = ShopFactory(seller=seller, name=SHOP_NAME, slug=SHOP_SLUG, whatsapp_phone=SELLER_PHONE)
            self.stdout.write(f"Boutique '{SHOP_SLUG}' créée.")
        return seller, shop

    def _seed_category(self):
        category = Category.objects.filter(slug=CATEGORY_SLUG).first()
        if not category:
            category = CategoryFactory(name=CATEGORY_NAME, slug=CATEGORY_SLUG)
            self.stdout.write(f"Catégorie '{CATEGORY_SLUG}' créée.")
        else:
            self.stdout.write(f"Catégorie '{CATEGORY_SLUG}' déjà présente.")
        return category

    def _seed_products(self, category, seller, shop):
        for spec in PRODUCTS:
            if Product.objects.filter(slug=spec["slug"]).exists():
                self.stdout.write(f"Produit '{spec['slug']}' déjà présent.")
                continue
            product = ProductFactory(
                category=category,
                seller=seller,
                shop=shop,
                name=spec["name"],
                slug=spec["slug"],
                description=f"Produit de démonstration pour les tests E2E ({spec['name']}).",
                price_xof=spec["price_xof"],
                stock=spec["stock"],
            )
            product.image.save(f"{spec['slug']}.png", ContentFile(_make_png(spec["name"], spec["color"])), save=True)
            ProductImageFactory(
                product=product,
                image=ContentFile(_make_png(f"{spec['name']} — galerie", spec["color"]), f"{spec['slug']}-galerie-1.png"),
                order=0,
                is_cover=True,
            )
            ProductImageFactory(
                product=product,
                image=ContentFile(_make_png(f"{spec['name']} — détail", spec["color"]), f"{spec['slug']}-galerie-2.png"),
                order=1,
            )
            self.stdout.write(f"Produit '{spec['slug']}' créé (couverture + 2 images galerie).")

    def _seed_delivery(self):
        # La migration delivery/0002 seed déjà zones et créneaux ; on ne crée
        # des données que s'il en manque (ex. base sans migration de données).
        active_zones = DeliveryZone.objects.filter(is_active=True)
        if active_zones.exists():
            self.stdout.write(f"{active_zones.count()} zones de livraison présentes.")
        else:
            for spec in ZONES:
                DeliveryZoneFactory(**spec)
                self.stdout.write(f"Zone '{spec['name']}' créée.")
        active_slots = DeliverySlot.objects.filter(is_active=True)
        if active_slots.exists():
            self.stdout.write(f"{active_slots.count()} créneaux de livraison présents.")
        else:
            for spec in SLOTS:
                DeliverySlotFactory(**spec)
                self.stdout.write(f"Créneau '{spec['label']}' créé.")

    def _seed_payment_settings(self):
        # Le singleton doit exister ; le COD est toujours actif par conception.
        settings_obj = PaymentSettings.get_solo()
        self.stdout.write(
            "Réglages paiement présents "
            f"(paiement en ligne : {'actif' if settings_obj.online_payment_enabled else 'coupé'}, "
            "COD : toujours actif)."
        )
