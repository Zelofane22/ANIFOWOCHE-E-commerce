from datetime import timedelta
from pathlib import Path

import dj_database_url
from decouple import Csv, config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config("SECRET_KEY", default="dev-secret-key-change-me")
DEBUG = config("DEBUG", default=True, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv())

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",
    "apps.products",
    "apps.orders",
    "apps.payments",
    "apps.users",
    "apps.delivery",
    "apps.notifications",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
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

# Railway injecte DATABASE_URL (add-on PostgreSQL) : on l'utilise si présente,
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
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

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
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
}

CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS", default="http://localhost:5173", cast=Csv()
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
