# AGENTS.md

Directives pour agents IA sur ce projet ANIFOWOCHE E-commerce.

## Règle absolue pour toutes les sessions

- **Toute commande liée au projet doit être exécutée via Docker Compose.** Cela inclut les tests, builds, lint, migrations, scripts Python/Node, exécution du backend/frontend et toute manipulation du runtime.
- **Ne jamais exécuter d'outils locaux** pour ce projet (`python`, `pip`, `npm`, `manage.py`, `vite`, `pytest`, `psql`, etc.) sauf si la commande est explicitement fournie par Docker Compose via `docker compose -f code/docker-compose.yml ...`.
- Si une commande doit être lancée dans un service, utiliser `docker compose -f code/docker-compose.yml exec <service> <cmd>` ou `docker compose -f code/docker-compose.yml run --rm <service> <cmd>`.
- Cette règle est prioritaire sur toute habitude locale ou tentative d'exécution directe.

## Environnement d'exécution

- **Ne jamais lancer l'app en local hors Docker.** Pas de `python manage.py runserver`, `npm run dev`, `npm start`, installation locale Python/Node/PostgreSQL.
- Tout passe par Docker Compose. Le fichier `docker-compose.yml` vit dans `code/`.
- Depuis la racine du repo : `docker compose -f code/docker-compose.yml <cmd>`.
- Démarrer : `docker compose -f code/docker-compose.yml up --build`.
- Exécuter dans un service : `docker compose -f code/docker-compose.yml exec <service> <cmd>`.
- `--build` uniquement après changement de `requirements.txt`, `package.json` ou d'un Dockerfile — le code est monté en volume.
- Fichiers `.env` requis : `code/backend/.env` et `code/frontend/.env` (voir `*.env.example`).
- Services : frontend Vite `:5173`, backend Django `:8000`, db PostgreSQL `:5432`.

## Stack

- **Frontend** : React 19 + Vite 8 + Tailwind CSS 4 + React Router 8 + Axios
- **Backend** : Django 6.0 + DRF + PostgreSQL (Python 3.13)
- **Auth** : JWT (`djangorestframework-simplejwt`), backend auth: `apps.users.backends.EmailOrPhoneModelBackend`
- **Admin** : Django Unfold (`unfold` dans INSTALLED_APPS, au-dessus de `django.contrib.admin`)
- **Images** : Cloudinary (`django-cloudinary-storage`) en prod, stockage disque en dev
- **Paiement** : FedaPay (sandbox)
- **Monitoring** : Sentry (backend + frontend, inactif sans DSN)
- **Env vars** : `python-decouple` (pas `django-environ`)

## Architecture backend

16 Django apps sous `code/backend/apps/` : `products`, `orders`, `payments`, `users`, `delivery`, `notifications`, `reviews`, `content`, `promotions`, `returns`, `wishlist`, `sellers`, `analytics`, `appearance`, `core` (middleware, signaux, management commands), `core.dashboard`.

Routes API : `/api/<domain>/` — voir `config/urls.py`. L'app `sellers` est montée sur `/api/` directement (pas `/api/sellers/`).

## Architecture frontend

Code-splitting par défaut : seules `Home` est eager dans `App.jsx`, les autres pages sont `lazy()`. Ne pas casser ce pattern.

Context API : `AuthContext`, `CartContext`, `SiteConfigContext`. Appels API dans `src/api/` (un fichier par domaine).

## CI/CD

Workflow `.github/workflows/ci.yml` — 3 jobs parallèles :
1. **backend** : `pip install` → `python manage.py test` → `pip-audit`
2. **frontend** : `npm ci` → `npm run lint` → `npm run build` → `npm audit`
3. **security** : `gitleaks` (secret scanning)

Déploiement auto sur push vers `main` : Render (backend + DB), Vercel (frontend).
Le frontend build inclut la génération du sitemap : `node scripts/generate-sitemap.mjs && vite build`.

## Tests

- **Backend** : `docker compose -f code/docker-compose.yml exec backend python manage.py test` (77 tests, appels externes mockés).
- **Frontend** : aucun test unitaire existant. CI vérifie uniquement `lint` + `build`.

## Conventions de modification

- Lire le code existant avant de modifier. Conserver la logique métier existante (API calls, panier, auth, checkout, dashboard).
- Améliorer l'UI sans casser les routes existantes.
- Vérifier mobile et desktop quand possible.
- Pour les commandes, préférer Docker Compose. Si un outil manque hors Docker, le signaler clairement.

## Workflow worktrees

Après toute tâche sur un worktree :
- Commit avec un message clair
- Pousser vers `develop` : `git push origin HEAD:develop`
- Ne pas laisser de changements non-commités

## Modèle et effort

Avant d'exécuter une tâche, identifier le modèle adapté. Sortie : `Model : <nom> | Effort : <niveau>`. Attendre confirmation avant d'exécuter.

### Multi-agents
Utiliser le mode multi-agents pour les grosses tâches full-stack.