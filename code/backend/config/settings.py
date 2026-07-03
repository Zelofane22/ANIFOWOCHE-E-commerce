from datetime import timedelta
import os
from pathlib import Path
from urllib.parse import urlsplit

import dj_database_url
from decouple import Csv, config

BASE_DIR = Path(__file__).resolve().parent.parent
ON_RENDER = bool(os.environ.get("RENDER"))


def _normalize_origins(origins):
    normalized = []
    for origin in origins:
        origin = origin.strip()
        if not origin:
            continue

        parsed = urlsplit(origin)
        if parsed.scheme and parsed.netloc:
            origin = f"{parsed.scheme}://{parsed.netloc}"
        else:
            origin = origin.rstrip("/")

        if origin not in normalized:
            normalized.append(origin)
    return normalized

SECRET_KEY = config("SECRET_KEY", default="dev-secret-key-change-me")
DEBUG = config("DEBUG", default=not ON_RENDER, cast=bool)
ALLOWED_HOSTS = list(config("ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv()))

RENDER_EXTERNAL_HOSTNAME = os.environ.get("RENDER_EXTERNAL_HOSTNAME")
if RENDER_EXTERNAL_HOSTNAME and RENDER_EXTERNAL_HOSTNAME not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# Identifiants du superadmin créé automatiquement au déploiement (voir entrypoint.sh).
# Changement de mot de passe forcé tant que ce mot de passe par défaut est actif
# (voir apps.core.middleware.ForceDefaultPasswordChangeMiddleware).
DEFAULT_SUPERUSER_USERNAME = config("DEFAULT_SUPERUSER_USERNAME", default="anifowoche")
DEFAULT_SUPERUSER_PASSWORD = config("DEFAULT_SUPERUSER_PASSWORD", default="Anifowoche123!")

INSTALLED_APPS = [
    "unfold",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "cloudinary_storage",
    "cloudinary",
    "django.contrib.humanize",
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",
    "apps.core",
    "apps.products",
    "apps.orders",
    "apps.payments",
    "apps.users",
    "apps.delivery",
    "apps.notifications",
    "apps.analytics",
    "apps.promotions",
    "apps.content",
    "apps.returns",
    "apps.reviews",
    "apps.wishlist",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "apps.core.middleware.ForceDefaultPasswordChangeMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=ON_RENDER, cast=bool)
SECURE_HSTS_SECONDS = config("SECURE_HSTS_SECONDS", default=31536000 if ON_RENDER else 0, cast=int)
SECURE_HSTS_INCLUDE_SUBDOMAINS = ON_RENDER
SECURE_HSTS_PRELOAD = ON_RENDER
CSRF_TRUSTED_ORIGINS = _normalize_origins(config("CSRF_TRUSTED_ORIGINS", default="", cast=Csv()))
if RENDER_EXTERNAL_HOSTNAME:
    CSRF_TRUSTED_ORIGINS.append(f"https://{RENDER_EXTERNAL_HOSTNAME}")
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG

# Render injecte DATABASE_URL (PostgreSQL) : on l'utilise si présente,
# sinon on retombe sur les variables DB_* discrètes (docker compose local).
_local_db_url = "postgresql://{user}:{password}@{host}:{port}/{name}".format(
    user=config("DB_USER", default="anifowoche"),
    password=config("DB_PASSWORD", default=""),
    host=config("DB_HOST", default="localhost"),
    port=config("DB_PORT", default="5432"),
    name=config("DB_NAME", default="anifowoche"),
)
DATABASES = {
    "default": dj_database_url.config(default=_local_db_url, conn_max_age=600)
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Africa/Porto-Novo"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "django.contrib.staticfiles.storage.StaticFilesStorage"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

# Cloudinary (stockage des images produits/bannières). Laisser les variables
# vides en local pour garder le stockage disque (FileSystemStorage) ; les
# renseigner sur Render pour bénéficier du CDN et de la persistance entre
# déploiements — voir docs/stack-technique.md.
CLOUDINARY_CLOUD_NAME = config("CLOUDINARY_CLOUD_NAME", default="")
CLOUDINARY_API_KEY = config("CLOUDINARY_API_KEY", default="")
CLOUDINARY_API_SECRET = config("CLOUDINARY_API_SECRET", default="")

if CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
    CLOUDINARY_STORAGE = {
        "CLOUD_NAME": CLOUDINARY_CLOUD_NAME,
        "API_KEY": CLOUDINARY_API_KEY,
        "API_SECRET": CLOUDINARY_API_SECRET,
    }
    STORAGES["default"] = {"BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage"}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": "60/minute",
        "user": "300/minute",
        "auth": "10/minute",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
}

CORS_ALLOWED_ORIGINS = _normalize_origins(
    config("CORS_ALLOWED_ORIGINS", default="http://localhost:5173", cast=Csv())
)

# Intégration FedaPay (sandbox). Valeurs placeholder tant que les vraies clés
# ne sont pas fournies via les variables d'environnement — voir docs/stack-technique.md.
FEDAPAY_BASE_URL = config("FEDAPAY_BASE_URL", default="https://sandbox-api.fedapay.com")
FEDAPAY_SECRET_KEY = config("FEDAPAY_SECRET_KEY", default="sk_sandbox_placeholder")
FEDAPAY_WEBHOOK_SECRET = config("FEDAPAY_WEBHOOK_SECRET", default="whsec_placeholder")
FRONTEND_BASE_URL = config("FRONTEND_BASE_URL", default="http://localhost:5173")

# Notifications WhatsApp Business Cloud API (Meta). Valeurs placeholder tant
# que le vrai token et le phone_number_id ne sont pas fournis — voir
# docs/stack-technique.md (WhatsApp Business).
WHATSAPP_API_BASE_URL = config("WHATSAPP_API_BASE_URL", default="https://graph.facebook.com/v20.0")
WHATSAPP_PHONE_NUMBER_ID = config("WHATSAPP_PHONE_NUMBER_ID", default="000000000000000")
WHATSAPP_ACCESS_TOKEN = config("WHATSAPP_ACCESS_TOKEN", default="whatsapp_token_placeholder")

# Thème de l'admin Django (django-unfold) — couleurs alignées sur la charte
# frontend (voir code/frontend/src/index.css : --color-brand et dérivés).
from django.templatetags.static import static  # noqa: E402
from django.urls import reverse_lazy  # noqa: E402


def _pending_orders_badge(request):
    from apps.orders.models import Order

    count = Order.objects.filter(status=Order.Status.RECEIVED).count()
    return count or None


UNFOLD = {
    "SITE_TITLE": "ANIFOWOCHE Admin",
    "SITE_HEADER": "ANIFOWOCHE",
    "SITE_SUBHEADER": "Administration",
    "SITE_SYMBOL": "storefront",
    "SHOW_HISTORY": True,
    "STYLES": [
        lambda request: static("admin/css/custom.css"),
    ],
    "COLORS": {
        "primary": {
            "50": "253 251 232",
            "100": "250 246 201",
            "200": "245 238 150",
            "300": "240 230 100",
            "400": "235 220 60",
            "500": "230 211 21",
            "600": "#a98111",
            "700": "184 166 15",
            "800": "140 126 12",
            "900": "100 90 9",
            "950": "70 63 6",
        },
    },
    "DASHBOARD_CALLBACK": "apps.core.dashboard.dashboard_callback",
    "SIDEBAR": {
        "show_search": True,
        "navigation": [
            {
                "items": [
                    {
                        "title": "Tableau de bord",
                        "icon": "dashboard",
                        "link": reverse_lazy("admin:index"),
                    },
                    {
                        "title": "Commandes",
                        "icon": "shopping_bag",
                        "link": reverse_lazy("admin:orders_order_changelist"),
                        "badge": _pending_orders_badge,
                    },
                    {
                        "title": "Produits",
                        "icon": "inventory_2",
                        "link": reverse_lazy("admin:products_product_changelist"),
                    },
                    {
                        "title": "Catégories",
                        "icon": "category",
                        "link": reverse_lazy("admin:products_category_changelist"),
                    },
                    {
                        "title": "Clients",
                        "icon": "group",
                        "link": "/admin/auth/user/?is_staff__exact=0",
                    },
                    {
                        "title": "Promotions",
                        "icon": "sell",
                        "link": reverse_lazy("admin:promotions_promotion_changelist"),
                    },
                    {
                        "title": "Coupons",
                        "icon": "confirmation_number",
                        "link": reverse_lazy("admin:promotions_coupon_changelist"),
                    },
                    {
                        "title": "Contenu",
                        "icon": "article",
                        "link": reverse_lazy("admin:content_banner_changelist"),
                    },
                    {
                        "title": "Inventaire",
                        "icon": "warehouse",
                        "link": "/admin/products/product/?o=6",
                    },
                    {
                        "title": "Livraisons",
                        "icon": "local_shipping",
                        "link": reverse_lazy("admin:delivery_delivery_changelist"),
                    },
                    {
                        "title": "Paiements",
                        "icon": "payments",
                        "link": reverse_lazy("admin:payments_payment_changelist"),
                    },
                    {
                        "title": "Retours & Remboursements",
                        "icon": "assignment_return",
                        "link": reverse_lazy("admin:returns_returnrequest_changelist"),
                    },
                    {
                        "title": "Avis",
                        "icon": "reviews",
                        "link": reverse_lazy("admin:reviews_review_changelist"),
                    },
                    {
                        "title": "Rapports",
                        "icon": "bar_chart",
                        "link": "/admin/rapports/",
                    },
                    {
                        "title": "Utilisateurs",
                        "icon": "manage_accounts",
                        "link": "/admin/auth/user/?is_staff__exact=1",
                    },
                    {
                        "title": "Activité système",
                        "icon": "history",
                        "link": reverse_lazy("admin:admin_logentry_changelist"),
                    },
                ],
            },
        ],
    },
}
