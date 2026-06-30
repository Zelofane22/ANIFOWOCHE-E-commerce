# ⚙️ CI/CD — Intégration et déploiement continus

[← Retour au README](../README.md)

## Vue d'ensemble

| Étape | Outil | Déclencheur |
|-------|-------|-------------|
| CI — lint & tests | GitHub Actions | Push ou Pull Request, toute branche |
| CD — backend | Railway (intégration GitHub native) | Push sur `main` |
| CD — frontend | Render Static Site (intégration GitHub native) | Push sur `main` |

Le déploiement backend et frontend ne passe pas par GitHub Actions : Railway et Render écoutent directement le repo GitHub via leur propre webhook et redéploient automatiquement à chaque push sur `main`. GitHub Actions est utilisé uniquement pour la CI (lint + tests) sur chaque PR, afin de bloquer une fusion qui casserait le build avant qu'elle n'atteigne `main` et ne déclenche un déploiement.

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
Railway           Render
(backend Django   (frontend React
 + PostgreSQL)      build statique)
```

## CI — GitHub Actions

Fichier à créer : `.github/workflows/ci.yml`. Déclenché sur `push` et `pull_request`, deux jobs indépendants :

**Job `backend`**
- Service `postgres:18` (conteneur éphémère pour les tests)
- Setup Python 3.13
- `pip install -r backend/requirements.txt`
- `python backend/manage.py test`

**Job `frontend`**
- Setup Node 24
- `npm ci` dans `frontend/`
- `npm run lint`
- `npm run build`

> ⚠️ Aucun test n'est encore écrit (`backend/apps/*` et `frontend/src/*` n'ont pas de fichiers `test*`). Le job `backend` passera trivialement jusqu'à l'ajout de vrais tests Django (`TestCase` par app). À planifier en priorité avec les modèles `Product`/`Order`.

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
| Scan d'image Docker | `aquasecurity/trivy-action` | Scan du `Dockerfile` backend avant déploiement Railway |

Secret scanning et SCA couvrent le risque le plus concret à ce stade (clé API committée par erreur, dépendance avec CVE connue) pour un coût de mise en place quasi nul. SAST/SBOM demandent un peu de réglage des faux positifs. DAST et scan d'image supposent une infra (staging, registry) qui n'existe pas encore — à revisiter une fois le MVP en prod.

## CD — Backend → Railway

- Projet Railway connecté au repo GitHub, **répertoire racine** configuré sur `backend/`
- Build via le `Dockerfile` existant ([backend/Dockerfile](../backend/Dockerfile)) — Railway le détecte et l'utilise automatiquement, pas de configuration supplémentaire requise
- Déploiement automatique à chaque push sur `main`
- Variables d'environnement à définir dans Railway : `SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS`, `DATABASE_URL`, `CORS_ALLOWED_ORIGINS` (URL du frontend Render), clés API FedaPay/KkiaPay
- **Base de données** : ⚠️ à confirmer — ce document suppose un add-on PostgreSQL Railway dans le même projet que le backend (Railway injecte alors `DATABASE_URL` automatiquement). Si la BDD doit être hébergée ailleurs, mettre à jour cette section.

## CD — Frontend → Render

- Service Render **Static Site** connecté au repo GitHub, **répertoire racine** configuré sur `frontend/`
- Build command : `npm install && npm run build`
- Publish directory : `frontend/dist` (sortie Vite)
- Déploiement automatique à chaque push sur `main`
- Variable d'environnement : `VITE_API_URL` → URL publique du backend Railway

## Stratégie de branches

- `main` = production. Toute fusion déclenche le déploiement automatique Railway (backend) et Render (frontend).
- Branches de feature + PR → CI uniquement (lint + tests). Pas de déploiement de preview/staging au MVP : la complexité n'est pas justifiée tant qu'il n'y a pas plusieurs contributeurs simultanés sur des features qui se chevauchent.

## Secrets & variables d'environnement

| Secret / variable | Stocké dans | Usage |
|---|---|---|
| `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS` | Railway (variables service backend) | Config Django |
| `DATABASE_URL` | Railway (injecté par l'add-on PostgreSQL) | Connexion BDD |
| `CORS_ALLOWED_ORIGINS` | Railway | Autoriser les requêtes depuis le domaine Render |
| Clés FedaPay / KkiaPay | Railway | Paiement mobile money / carte |
| `VITE_API_URL` | Render (variables du Static Site) | URL de l'API consommée par le frontend |
| Secrets GitHub Actions (si ajoutés plus tard) | GitHub repo → Settings → Secrets | Ex. tokens pour notifications CI |

Aucun secret ne doit être committé dans `.env` — `backend/.env` et `frontend/.env` restent locaux (déjà ignorés via `.dockerignore`/git, à vérifier que `.gitignore` les exclut bien).

## Limites connues

- Pas d'environnement de staging séparé : une PR n'est validée que par CI, jamais déployée en preview avant le merge.
- Aucun rollback automatique configuré — un déploiement cassé sur `main` doit être corrigé par un nouveau commit ou un revert manuel depuis l'interface Railway/Render.
- Comportement de mise en veille (cold start) dépendant du plan choisi sur Railway et Render — à vérifier selon le tier retenu, surtout si le tier gratuit/hobby est utilisé.

## Prochaines étapes

- [x] Créer `.github/workflows/ci.yml` avec les jobs `backend`, `frontend` et `security` (gitleaks + audits de dépendances — Priorité 1 de la roadmap sécurité)
- [x] Créer `.github/dependabot.yml` (SCA pip/npm/github-actions)
- ⚠️ Générer et committer `frontend/package-lock.json` (`npm install` en local), puis repasser le step `frontend` de `npm install` à `npm ci` dans le workflow pour des builds reproductibles
- Créer les projets Railway (backend + PostgreSQL) et Render (frontend), connecter le repo GitHub, configurer les répertoires racine et variables d'environnement
- Écrire les premiers tests Django (`apps/products`, `apps/orders`) pour que le job `backend` ait une valeur réelle
- (Optionnel, une fois la base de tests démarrée) ajouter Vitest côté frontend et l'intégrer comme step CI
