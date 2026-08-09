# AGENTS.md

Directives pour agents IA sur ce projet ANIFOWOCHE E-commerce.

## Règle absolue pour toutes les sessions

- **Toute commande liée au projet doit être exécutée via Docker Compose.** Cela inclut les tests, builds, lint, migrations, scripts Python/Node, exécution du backend/frontend et toute manipulation du runtime.
- **Ne jamais exécuter d'outils locaux** pour ce projet (`python`, `pip`, `npm`, `manage.py`, `vite`, `pytest`, `psql`, etc.) sauf si la commande est explicitement fournie par Docker Compose via `docker compose -f code/docker-compose.yml ...`.
- Si une commande doit être lancée dans un service, utiliser `docker compose -f code/docker-compose.yml exec <service> <cmd>` ou `docker compose -f code/docker-compose.yml run --rm <service> <cmd>`.
- Toute modification du projet doit être fais dans un worktree temporaire puis commit sur la branche Develop
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
1. **backend** : `pip install` → `pytest --cov` → `pip-audit`
2. **frontend** : `npm ci` → `npm run lint` → `npm run build` → `npm audit`
3. **security** : `gitleaks` (secret scanning)

Déploiement auto sur push vers `main` : Render (backend + DB), Vercel (frontend).
Le frontend build inclut la génération du sitemap : `node scripts/generate-sitemap.mjs && vite build`.

## Investigation prod (Render MCP)

En cas de problème en production, **utiliser les outils Render MCP** pour investiguer avant de toucher au code. Ne jamais supposer l'origine d'un bug sans vérifier les logs/métriques en prod.

Actions disponibles via MCP Render :
- **Logs** : `render_list_logs` avec filtres (service, level, path, statusCode) pour retrouver les erreurs.
- **Métriques** : `render_get_metrics` (CPU, mémoire, instances, requêtes HTTP, latence, bandwidth).
- **Déploys** : `render_list_deploys` / `render_get_deploy` pour vérifier l'état du dernier déploiement.
- **Services** : `render_list_services` / `render_get_service` pour l'état général.
- **Base de données** : `render_query_render_postgres` pour des requêtes SQL read-only directes.
- **Variables d'env** : `render_get_service` pour inspecter la config.

Workflow d'investigation :
1. `render_list_logs` avec `level: ["error"]` pour le service concerné
2. `render_get_metrics` pour les 24h/7 derniers jours
3. `render_list_deploys` pour vérifier si un déploiement récent a introduit le problème
4. Si besoin, query SQL via `render_query_render_postgres`

Workspace Render : `tea-d4neu37gi27c738i7vh0` (My Workspace).

## Tests

- **Backend** : `docker compose -f code/docker-compose.yml exec backend pytest` (272 tests, appels externes mockés). Coverage : `pytest --cov=apps --cov-report=term-missing`.
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
- Ne pas laisser de changements du worktree utilisé non-commités

## Modèle et effort

Avant d'exécuter une tâche, identifier le modèle (dans la liste des models opencode go) adapté. 
Go inclut les modèles ci-dessous, avec des limites généreuses et un accès fiable.
```
Grok 4.5
GPT 5.6 Luna
GLM-5.2
GLM-5.1
Kimi K3
Kimi K2.7 Code
Kimi K2.6
MiMo-V2.5-Pro
MiMo-V2.5
Qwen3.8 Max
Qwen3.7 Max
Qwen3.7 Plus
Qwen3.6 Plus
MiniMax M3
MiniMax M2.7
DeepSeek V4 Pro
DeepSeek V4 Flash
Hy3
```
Sortie : `Model : <nom> | Effort : <niveau>`. Attendre confirmation avant d'exécuter.

### Multi-agents
Utiliser le mode multi-agents pour les grosses tâches full-stack.