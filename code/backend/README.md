# Backend - ANIFOWOCHE E-commerce

Ce document décrit la structure et les commandes essentielles pour travailler avec le backend Django du projet.

Important : Ne jamais lancer le backend localement hors Docker. Tout passe par Docker Compose (voir AGENTS.md pour les règles détaillées).

Chemin
- Racine backend : `code/backend`
- Fichier Docker Compose : `code/docker-compose.yml` (utiliser depuis la racine du repo)

Prérequis
- Docker et Docker Compose installés
- Fichiers d'environnement : `code/backend/.env` et `code/frontend/.env` (voir `*.env.example`)

Démarrage en développement
- Depuis la racine du repo :
  docker compose -f code/docker-compose.yml up --build

Notes :
- Utiliser `--build` uniquement après modification de `requirements.txt`, `package.json` ou d'un Dockerfile (le code est monté en volume).
- Pour détacher : ajouter `-d`.

Exécuter une commande dans le conteneur backend
- Exemple : ouvrir un shell Django
  docker compose -f code/docker-compose.yml exec backend python manage.py shell

- Exécuter les migrations
  docker compose -f code/docker-compose.yml exec backend python manage.py migrate

- Créer des migrations
  docker compose -f code/docker-compose.yml exec backend python manage.py makemigrations

- Lancer les tests backend
  docker compose -f code/docker-compose.yml exec backend python manage.py test

Structure du projet
- `code/backend/config/` : settings.py, urls.py, wsgi/asgi
- `code/backend/apps/` : applications Django par domaine métier :
  - core, products, orders, payments, users, delivery, notifications, analytics, promotions, content, returns, reviews, wishlist, appearance, sellers
- Chaque app contient typiquement : `models.py`, `views.py`, `serializers.py`, `urls.py`, `tests.py`, `migrations/`

Points clés de configuration
- Authentification : JWT via `rest_framework_simplejwt` (configurée dans `config/settings.py`).
- Stockage d'images : basculable entre FileSystem (dev) et Cloudinary (prod) selon variables d'environnement (`CLOUDINARY_*`).
- Base de données : PostgreSQL — `DATABASES` est résolu via `dj_database_url` ou variables DB_*.
- Fichiers statiques/media : `STATIC_ROOT` et `MEDIA_ROOT` configurés dans `config/settings.py`.

Variables d'environnement importantes
- SECRET_KEY — clé Django (en production, doit être >=32 caractères et différente de la valeur par défaut)
- DEBUG — bool
- DATABASE_URL ou DB_USER/DB_PASSWORD/DB_HOST/DB_PORT/DB_NAME
- DEFAULT_SUPERUSER_USERNAME, DEFAULT_SUPERUSER_PASSWORD — utilisés par l'entrypoint pour créer un superadmin par défaut
- CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET — pour stockage Cloudinary
- FEDAPAY_BASE_URL, FEDAPAY_SECRET_KEY, FEDAPAY_WEBHOOK_SECRET — intégration paiements
- WHATSAPP_API_BASE_URL, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN — notifications WhatsApp
- RESEND_API_KEY, RESEND_FROM_EMAIL — envoi d'emails via Resend
- NGROK_AUTHTOKEN — pour tests webhook en dev
- FRONTEND_BASE_URL, SELLER_FRONTEND_BASE_URL — URL frontend

Routes principales (extraites de `config/urls.py`)
- Admin : `/admin/` (admin Django personnalisé, pages additionnelles dans `apps.core.urls`)
- Store status : `/api/store/status/`
- Site config : `/api/site-config/`
- Products : `/api/products/` (ViewSets + routes sellers)
- Orders : `/api/orders/`
- Payments : `/api/payments/`
- Delivery : `/api/delivery/`
- Reviews : `/api/reviews/`
- Content : `/api/content/`
- Promotions : `/api/promotions/`
- Returns : `/api/returns/`
- Wishlist : `/api/wishlist/`
- Sellers (monté directement sur `/api/`) : routes pour gestion vendeurs
- Auth : `/api/auth/`, token obtain `/api/auth/token/`, token refresh `/api/auth/token/refresh/`
- Analytics, Notifications, etc.

Bonnes pratiques & conventions
- Ne pas exécuter `manage.py runserver` ou installer localement Python/Node/Postgres : utiliser Docker Compose.
- Appliquer la logique métier dans les apps/domaines et exposer via serializers + viewsets DRF.
- Respecter le pattern de lazy-loading côté frontend (uniquement renseigné ici pour cohérence avec le projet).
- Quand les variables Cloudinary sont absentes, le stockage local est utilisé (utile en dev).

Debug & diagnostic
- Si DEBUG=False et SECRET_KEY insufficient (valeur par défaut ou trop courte), Django refuse de démarrer (sécurité).
- Vérifier `RENDER_EXTERNAL_HOSTNAME` si déployé sur Render (ajoute automatiquement dans ALLOWED_HOSTS).
- Pour inspecter les requêtes SQL lors du debug, utiliser le shell Django et `django.db.connection.queries` (attention perf).

CI / Tests
- Le pipeline CI exécute : tests backend (`python manage.py test`) et vérifications de sécurité.

Ressources supplémentaires
- AGENTS.md : directives pour travailler sur le projet (Docker, démarrage, contraintes)
- `docs/` : documentation technique complémentaire (stack-technique.md, etc.)

Contact / aide
- Pour toute question spécifique sur une app, indiquer le nom de l'app (ex: `apps/products`) et un exemple de requête à tracer.

---

Fichier généré automatiquement pour faciliter la prise en main du backend.

# Structure global
Voici la structure en pratique :

```text
code/backend/
├── apps/
│   ├── core/           # logique centrale, admin, middleware, signaux
│   ├── products/       # produits, catégories, images
│   ├── orders/         # commandes
│   ├── payments/       # paiements (FedaPay)
│   ├── users/          # authentification, JWT, utilisateurs
│   ├── delivery/       # livraison
│   ├── notifications/  # notifications
│   ├── analytics/      # analytics
│   ├── promotions/     # promotions
│   ├── content/        # contenu / pages / CMS
│   ├── returns/        # retours
│   ├── reviews/        # avis clients
│   ├── wishlist/       # wishlist
│   ├── appearance/     # configuration visuelle du site
│   └── sellers/        # profils vendeurs, API seller
├── config/
│   ├── settings.py     # configuration globale Django
│   ├── urls.py         # routage principal
│   ├── wsgi.py
│   └── asgi.py
├── manage.py
├── requirements.txt
├── requirements-dev.txt
├── templates/
├── entrypoint.sh
└── .env.example
```

Les grandes parties

- config/
  - C’est le cœur du projet Django.
  - settings.py contient :
    - les apps installées
    - la config DB
    - les middlewares
    - les réglages DRF (Django REST Framework)
    - la config JWT
    - les variables d’environnement (CORS, Cloudinary, FedaPay, WhatsApp, Resend, etc.)
  - urls.py centralise toutes les routes API du backend.

- apps/
  - Chaque dossier sous apps/ représente une fonctionnalité ou un domaine.
  - Chaque app suit souvent la même structure :
    - models.py : les tables / modèles Django
    - views.py : la logique métier et les endpoints API
    - serializers.py : transformation des objets vers/depuis JSON
    - urls.py : les routes de cette app
    - tests.py : tests
    - migrations/ : historique de la base

Ce qui est intéressant dans ton projet

- L’architecture est “modulaire” :
  - products gère les produits
  - orders gère les commandes
  - payments gère les paiements
  - users gère l’authentification
  - sellers gère les vendeurs
  - etc.

- Le backend est API-first :
  - il expose des endpoints REST via Django REST Framework
  - la plupart des fonctionnalités passent par des ViewSets ou des APIViews

- L’authentification est faite avec JWT :
  - dans settings.py, DRF est configuré avec JWTAuthentication
  - l’auth se fait via apps/users

- L’admin Django est personnalisé :
  - via django-unfold
  - et avec des routes custom dans apps/core

- Le projet est pensé pour l’e-commerce :
  - produits
  - paniers/commandes
  - paiements
  - livraison
  - avis
  - promotions
  - retours
  - notifications

Un exemple concret de flux

- Une requête vers /api/products/ passe par :
  - config/urls.py
  - apps/products/urls.py
  - apps/products/views.py
  - puis le modèle Product et le serializer associé

Ce qui est déjà bien mis en place

- séparation des responsabilités
- app par domaine
- configuration centralisée
- API organisée
- support pour auth, admin, paiements, stockage d’images, etc.
