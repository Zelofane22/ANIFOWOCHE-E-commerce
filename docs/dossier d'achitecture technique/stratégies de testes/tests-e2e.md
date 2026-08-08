# Plan — Tests E2E de parcours utilisateurs (Playwright)

Statut : 📋 Plan validé (à implémenter)

## Objectif

Couvrir les parcours boutique complets (client + seller) sur la stack Docker locale,
pour détecter en CI les régressions de type « erreurs en prod » : auth/refresh des
tokens, lazy-load des pages, tunnel de commande, dashboard seller.

Périmètre décidé :
- Parcours **client boutique complet** testé de bout en bout (visite → achat → confirmation).
- **Aucun test FedaPay** pour l'instant — le paiement en ligne reste couvert par les
  272 tests backend mockés. Le parcours payant E2E passe par le **COD** (paiement à la livraison).
- Cible d'exécution : **stack Docker local** (dev server Vite + backend Django).

## Contexte & diagnostic

Le frontend n'a aucun test E2E. La CI actuelle fait lint + build (frontend) et
pytest (backend). Les bugs prod récents (ImportError `notify_payment_retry`,
filtre Sentry `beforeSend` lu sur le mauvais champ, user resté « connecté » après
échec de refresh) n'étaient pas détectables par la CI.

Le backend dispose déjà d'un socle solide : 272 tests, factories
(`apps/core/factories.py`), mocks FedaPay/WhatsApp/Resend (`conftest.py`),
commande `create_default_superuser`. Ces factories seront réutilisées pour le seed E2E.

## Fichiers à créer / modifier

### Backend — seed reproductible

1. **`code/backend/apps/core/management/commands/seed_e2e.py`** (nouveau, idempotent)
   - Réutilise les factories de `apps/core/factories.py`.
   - Crée :
     - 1 catégorie + produits (avec images)
     - 1 client (email / mot de passe connus) + profil
     - 1 seller + boutique + profil seller (slugs connus)
     - zones / créneaux de livraison + `PaymentSettings` (COD actif)
   - Exécution :
     ```
     docker compose -f code/docker-compose.yml exec backend python manage.py seed_e2e
     ```

### Frontend — infra Playwright

2. **`code/frontend/package.json`**
   - Ajouter `@playwright/test` en devDependencies.
   - Ajouter le script `test:e2e`.

3. **`code/frontend/playwright.config.js`** (nouveau)
   - `baseURL: http://localhost:5173`
   - 2 projets : Chromium desktop + Pixel mobile.
   - `reporter: list`, `trace: on-first-retry`, `retries: 1` (anti-flakiness).

4. **`code/frontend/e2e/customer.spec.js`** (nouveau) — parcours client complet.
5. **`code/frontend/e2e/seller.spec.js`** (nouveau) — parcours seller.
6. **`code/frontend/e2e/auth-regression.spec.js`** (nouveau) — régression auth 401.

### Docker & CI

7. **`code/docker-compose.yml`**
   - Service `e2e` : image `mcr.microsoft.com/playwright`, `depends_on` frontend+backend,
     commande `npx playwright test`. Le service joint `frontend:5173` en réseau interne
     (à confirmer : `network_mode: service:frontend` ou réseau partagé explicite).

8. **`.github/workflows/ci.yml`**
   - Job `e2e` : démarre db+backend+frontend, lance le seed, puis `npx playwright test`.
   - Bloque le merge si un parcours critique échoue.

## Parcours couverts

### `e2e/customer.spec.js` — Parcours client boutique COMPLET

| # | Test | Étapes | Valide |
|---|---|---|---|
| 1 | Visite publique | `/` → `/catalogue` → `/produits/:slug` | rendu, lazy-load, pas d'erreur console |
| 2 | Auth client | register → login → `/compte` | tokens + état UI cohérent |
| 3 | Achat COD complet | `/produits/:slug` → ajouter au panier → `/panier` → `/commande` (COD) → `/commande/confirmation` | tunnel complet, panier vidé, commande créée côté backend |

### `e2e/seller.spec.js`

| # | Test | Étapes | Valide |
|---|---|---|---|
| 4 | Login seller (seedé) | `/login` → dashboard | auth seller + `/seller/profile/` OK |
| 5 | Gestion produits | dashboard → `/products` → création produit | CRUD seller |
| 6 | Commandes seller | `/orders` → détail | listing + vue détail |

### `e2e/auth-regression.spec.js`

| # | Test | Étapes | Valide |
|---|---|---|---|
| 7 | Dégradation réseau | `page.route` intercepte `/auth/me/` → 401 | l'UI déconnecte proprement (couvre le fix token refresh) |

## Détails d'exécution

- Les E2E tournent **contre le serveur dev Vite** déjà monté en volume (cohérent
  avec AGENTS.md, pas de rebuild).
- En dev, Sentry n'est pas initialisé (`import.meta.env.PROD` false) → pas de bruit.
  La logique refresh / axios reste active et testable.
- **Anti-flakiness** :
  - attendre les attributs `aria-busy` (Suspense) et les titres de page, pas de délais fixes
  - `retries: 1` et `trace: on-first-retry` pour diagnostiquer les flakiness
- Le seed est idempotent → CI propre et reproductible.
- FedaPay : hors périmètre E2E pour l'instant (couvert par les tests backend mockés).

## Étapes de vérification

1. `docker compose -f code/docker-compose.yml exec backend python manage.py seed_e2e`
2. `docker compose -f code/docker-compose.yml run --rm e2e npx playwright test`
3. Lint + build frontend inchangés (les nouveaux fichiers e2e doivent passer le lint).
4. Job CI `e2e` vert sur PR.
5. Après quelques semaines, évaluer l'ajout de Playwright dans le pipeline complet
   (fragilité, durée, valeur) avant d'étendre.

## Hors périmètre (futur)

- Tests E2E FedaPay (sandbox ou mock backend).
- Tests de performance / charge.
- Tests visuels (screenshots de régression).
- E2E contre le staging Vercel + Render (preview) pour tester l'état réel de prod.
