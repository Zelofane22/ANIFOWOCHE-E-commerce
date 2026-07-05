# ⚙️ CI/CD — Intégration et déploiement continus

[← Retour au README](../README.md)

## Vue d'ensemble

| Étape | Outil | Déclencheur |
|-------|-------|-------------|
| CI — lint & tests | GitHub Actions | Push ou Pull Request, toute branche |
| CD — backend | Render (Blueprint GitHub) | Push sur `main` |
| CD — frontend | Vercel (intégration GitHub native) | Push sur `main` |
| Sauvegarde BDD (US-37) | GitHub Actions ([db-backup.yml](../.github/workflows/db-backup.yml)) | Cron quotidien 03:00 UTC + manuel — voir [docs/backups.md](backups.md) |

Le déploiement backend et frontend ne passe pas par GitHub Actions : Render et Vercel écoutent directement le repo GitHub via leur propre webhook et redéploient automatiquement à chaque push sur `main`. GitHub Actions est utilisé uniquement pour la CI (lint + tests) sur chaque PR, afin de bloquer une fusion qui casserait le build avant qu'elle n'atteigne `main` et ne déclenche un déploiement.

## Schéma du flux

```
 dev → push branche / PR
            │
            ▼
   GitHub Actions (CI)
   ├─ job backend  : pip install → manage.py test
   └─ job frontend : npm ci → lint → build
            │
        (merge sur main)
            │
   ┌────────┴────────┐
   ▼                 ▼
Render            Vercel
(backend Django   (frontend React
 + PostgreSQL)      build statique)
```

## CI — GitHub Actions

Fichier à créer : `.github/workflows/ci.yml`. Déclenché sur `push` et `pull_request`, deux jobs indépendants :

**Job `backend`**
- Service `postgres:18` (conteneur éphémère pour les tests)
- Setup Python 3.13
- Variables CI : `DEBUG=False` et `SECRET_KEY` factice de plus de 32 caractères pour valider le garde-fou de configuration production sans utiliser de secret réel
- `pip install -r code/backend/requirements.txt`
- `python code/backend/manage.py test`

**Job `frontend`**
- Setup Node 24
- `npm ci` dans `code/frontend/`
- `npm run lint`
- `npm run build`

> ⚠️ Aucun test n'est encore écrit (`code/backend/apps/*` et `code/frontend/src/*` n'ont pas de fichiers `test*`). Le job `backend` passera trivialement jusqu'à l'ajout de vrais tests Django (`TestCase` par app). À planifier en priorité avec les modèles `Product`/`Order`.

## Sécurité (roadmap)

Le pipeline actuel ne fait que lint + tests, sans aucun contrôle de sécurité. Pour un MVP solo avec paiement en ligne (FedaPay/KkiaPay), tout n'est pas nécessaire d'un coup : priorisation ci-dessous, intégrée uniquement via GitHub Actions (pas d'outil tiers payant pour le moment).

**Priorité 1 — à ajouter rapidement (gratuit, faible config, fort impact)**

| Contrôle | Outil | Intégration |
|---|---|---|
| Secret scanning | `gitleaks/gitleaks-action` | Nouveau job CI, sur push et PR |
| SCA (dépendances vulnérables) | Dependabot (natif GitHub) | `.github/dependabot.yml` — alertes automatiques, pas un job CI |
| Audit dépendances npm | `npm audit --audit-level=high` | Step dans le job `frontend` existant |
| Audit dépendances Python | `pip-audit` | Step dans le job `backend` existant |

**Priorité 2 — une fois une vraie base de tests en place**

| Contrôle | Outil | Notes |
|---|---|---|
| SAST Python | `bandit` | Step supplémentaire job `backend` |
| SAST JS/TS | `eslint-plugin-security` ou `semgrep` (free tier) | Step job `frontend` |
| SBOM | `anchore/sbom-action` (Syft) | Artifact généré à chaque build, non bloquant |

**Priorité 3 — plus tard, une fois un environnement déployé accessible**

| Contrôle | Outil | Notes |
|---|---|---|
| DAST | `zaproxy/action-baseline` (OWASP ZAP) | Nécessite une URL staging — pas pertinent tant qu'il n'y a pas d'environnement de preview (cf. [Stratégie de branches](#stratégie-de-branches)) |
| Scan d'image Docker | `aquasecurity/trivy-action` | Scan de l'image backend avant déploiement Render si une image Docker est utilisée |

Secret scanning et SCA couvrent le risque le plus concret à ce stade (clé API committée par erreur, dépendance avec CVE connue) pour un coût de mise en place quasi nul. SAST/SBOM demandent un peu de réglage des faux positifs. DAST et scan d'image supposent une infra (staging, registry) qui n'existe pas encore — à revisiter une fois le MVP en prod.

## CD — Backend → Render

- Blueprint Render connecté au repo GitHub via [render.yaml](../render.yaml)
- Service backend `anifowoche-backend`, **répertoire racine** configuré sur `code/backend/`
- Build command : `./build.sh`
- Start command : `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
- Le script [build.sh](../code/backend/build.sh) installe les dépendances, exécute `collectstatic` et applique les migrations.
- `config/settings.py` lit `DATABASE_URL` via `dj-database-url` si la variable est présente (cas Render), sinon retombe sur les variables `DB_*` discrètes (cas docker compose local) — aucune bascule manuelle nécessaire.
- Déploiement automatique à chaque push sur `main`
- Variables d'environnement à définir dans Render : `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, `FRONTEND_BASE_URL`, clés API FedaPay/KkiaPay (`FEDAPAY_SECRET_KEY`, `FEDAPAY_WEBHOOK_SECRET`), variables Cloudinary et WhatsApp si activées. `DATABASE_URL`, `SECRET_KEY`, `RENDER` et `RENDER_EXTERNAL_HOSTNAME` sont générées ou injectées automatiquement par Render via le Blueprint.
- **Base de données** : PostgreSQL Render `anifowoche-db`, déclaré dans [render.yaml](../render.yaml). Render injecte `DATABASE_URL` dans le service backend.
- Détails opérationnels : [docs/render.md](render.md)

## CD — Frontend → Vercel

- Projet Vercel connecté au repo GitHub, **Root Directory** configuré sur `code/frontend/`
- Framework preset : **Vite**
- Build command : `npm run build` (Vercel installe les dépendances avant le build)
- Output directory : `dist` (sortie Vite, relative à `code/frontend/`)
- Déploiement automatique à chaque push sur `main`
- Variable d'environnement : `VITE_API_BASE_URL` → URL publique de l'API backend Render, avec le suffixe `/api`, par exemple `https://anifowoche-backend.onrender.com/api`
- Monitoring Sentry : le DSN du projet Sentry « React » est configuré par défaut dans le code et peut être surchargé via `VITE_SENTRY_DSN` ; pour l'upload des source maps au build : `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` (le plugin Vite ne s'active que si le token est présent)
- Le fichier [code/frontend/vercel.json](../code/frontend/vercel.json) force les rewrites SPA vers `index.html`, pour que les routes React (`/catalogue`, `/panier`, `/compte`, etc.) fonctionnent aussi après un rafraîchissement direct.

## Stratégie de branches

- `main` = production. Toute fusion déclenche le déploiement automatique Render (backend) et Vercel (frontend).
- Branches de feature + PR → CI uniquement (lint + tests). Pas de déploiement de preview/staging au MVP : la complexité n'est pas justifiée tant qu'il n'y a pas plusieurs contributeurs simultanés sur des features qui se chevauchent.

## Secrets & variables d'environnement

| Secret / variable | Stocké dans | Usage |
|---|---|---|
| `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS` | Render (Blueprint + variables service backend) | Config Django |
| `DATABASE_URL` | Render (injecté par PostgreSQL Render) | Connexion BDD |
| `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` | Render | Autoriser les requêtes depuis le domaine Vercel |
| Clés FedaPay / KkiaPay | Render | Paiement mobile money / carte |
| `VITE_API_BASE_URL` | Vercel (Environment Variables) | URL de l'API consommée par le frontend, ex. `https://anifowoche-backend.onrender.com/api` |
| `SENTRY_DSN` | Render | Monitoring erreurs/performance backend (surcharge le DSN configuré par défaut) |
| `VITE_SENTRY_DSN` | Vercel (Environment Variables) | Monitoring erreurs/performance frontend (surcharge le DSN configuré par défaut) |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | Vercel (env de build) | Upload des source maps vers Sentry au build (plugin Vite inactif sans le token) |
| `RENDER_DATABASE_URL`, `BACKUP_PASSPHRASE` | GitHub repo → Settings → Secrets → Actions | Sauvegarde quotidienne chiffrée de la BDD ([db-backup.yml](../.github/workflows/db-backup.yml), voir [docs/backups.md](backups.md)) |

Aucun secret ne doit être committé dans `.env` — `code/backend/.env` et `code/frontend/.env` restent locaux (déjà ignorés via `.dockerignore`/git, à vérifier que `.gitignore` les exclut bien).

## Limites connues

- Pas d'environnement de staging séparé : une PR n'est validée que par CI, jamais déployée en preview avant le merge.
- Aucun rollback automatique configuré — un déploiement cassé sur `main` doit être corrigé par un nouveau commit ou un revert manuel depuis l'interface Render/Vercel.
- Comportement de mise en veille (cold start) dépendant du plan choisi sur Render pour le backend — à vérifier selon le tier retenu. Vercel sert le frontend statique sans cold start applicatif côté client.

## Prochaines étapes

- [x] Créer `.github/workflows/ci.yml` avec les jobs `backend`, `frontend` et `security` (gitleaks + audits de dépendances — Priorité 1 de la roadmap sécurité)
- [x] Créer `.github/dependabot.yml` (SCA pip/npm/github-actions)
- [x] Rendre l'image Docker backend prête pour la prod : `entrypoint.sh` (migrate + collectstatic + gunicorn), WhiteNoise pour les statiques, support `DATABASE_URL` via `dj-database-url` (repli sur les variables `DB_*` locales) — testé via un conteneur jetable dans docker compose
- ⚠️ Générer et committer `frontend/package-lock.json` (`npm install` en local), puis repasser le step `frontend` de `npm install` à `npm ci` dans le workflow pour des builds reproductibles
- Créer le Blueprint Render (backend + PostgreSQL) et le projet Vercel (frontend), connecter le repo GitHub, configurer les variables d'environnement — action manuelle sur les consoles Render/Vercel, hors du scope de ce dépôt
- Écrire les premiers tests Django (`apps/products`, `apps/orders`) pour que le job `backend` ait une valeur réelle
- (Optionnel, une fois la base de tests démarrée) ajouter Vitest côté frontend et l'intégrer comme step CI
