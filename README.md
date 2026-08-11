# 🛍️ ANIFOWOCHE — Plateforme e-commerce

> Boutique en ligne de tissus locaux, vêtements et accessoires homme — Cotonou, Bénin.

**Document de cadrage — Version 3.0 · Août 2026 · Développeur solo (alternant ingénierie de production)**

| Statut | Durée MVP | Budget/mois | Zone cible |
|--------|-----------|-------------|------------|
| MVP terminé (Sprints 1-4) · Sprint 5 (E6+E7) et Sprint 6 (E8+E9) terminés — rôles admin, revue sécurité, relance des paiements échoués (US-34), sauvegardes BDD + monitoring Sentry (US-37) faits ; seul le paiement réel (US-32) attend de vraies clés FedaPay/KkiaPay ; WhatsApp (US-33) reporté (E15) · E11 partiel : US-42 (images optimisées + lazy loading) et US-43 (meta tags dynamiques, sitemap.xml, OG) terminées ; US-44 (Redis cache) Phase 2 · **ANIF Seller** (SAAS vitrine privée pour vendeurs, `seller.anifowoche.com`) lancé · Sprint 7 (E10 — qualité & tests) planifié | ~3 mois (4 sprints MVP) | 0 € (Render gratuit) | Cotonou, Bénin |

---

## 📖 Documentation

| Document | Contenu |
|----------|---------|
| [docs/ANIFOWOCHE_boutique/contexte.md](docs/ANIFOWOCHE_boutique/contexte.md) | Contexte, produits vendus, objectifs MVP, contraintes |
| [docs/ANIFOWOCHE_boutique/backlog.md](docs/ANIFOWOCHE_boutique/backlog.md) | Backlog Agile MVP (terminé) — épics & user stories E1-E5 |
| [docs/ANIFOWOCHE_boutique/backlog-v2.md](docs/ANIFOWOCHE_boutique/backlog-v2.md) | Backlog v2 (post-MVP) — épics & user stories E6-E15, vérifiées contre l'état réel du code |
| [docs/ANIFOWOCHE_boutique/risques.md](docs/ANIFOWOCHE_boutique/risques.md) | Analyse des risques et mitigations |
| [docs/ANIFOWOCHE_boutique/figma-make-prompt.md](docs/ANIFOWOCHE_boutique/figma-make-prompt.md) | Prompt Figma Make pour la maquette responsive |
| [docs/ANIFOWOCHE_boutique/ANIF Seller/](docs/ANIFOWOCHE_boutique/ANIF%20Seller/README.md) | ANIF Seller — SAAS de vitrine privée pour vendeurs (cadrage, architecture, implementation, admin) |
| [docs/dossier d'achitecture technique/stack-technique.md](docs/dossier%20d'achitecture%20technique/stack-technique.md) | Stack, architecture applicative, déploiement Render, outils |
| [docs/dossier d'achitecture technique/maquettes.md](docs/dossier%20d'achitecture%20technique/maquettes.md) | Wireframes texte des écrans MVP (catalogue, fiche produit, panier, commande) |
| [docs/dossier d'achitecture technique/ci-cd.md](docs/dossier%20d'achitecture%20technique/ci-cd.md) | Structure CI/CD — GitHub Actions, déploiement Render (backend) & Vercel (frontend) |
| [docs/dossier d'achitecture technique/sprints/planning.md](docs/dossier%20d'achitecture%20technique/sprints/planning.md) | Planning détaillé des 4 sprints MVP (terminé) |
| [docs/dossier d'achitecture technique/sprints/planning-v2.md](docs/dossier%20d'achitecture%20technique/sprints/planning-v2.md) | Planning v2 (post-MVP) — sprints 5+ par priorité/dépendance, sans capacité horaire fixe |
| [docs/dossier d'achitecture technique/sprints/sprint5-progress.md](docs/dossier%20d'achitecture%20technique/sprints/sprint5-progress.md) | Suivi des tâches Sprint 5 (terminé) |
| [docs/dossier d'achitecture technique/sprints/sprint6-progress.md](docs/dossier%20d'achitecture%20technique/sprints/sprint6-progress.md) | Suivi des tâches Sprint 6 (terminé — seul US-32 attend de vraies clés FedaPay, US-33 reporté) |
| [docs/dossier d'achitecture technique/security-review.md](docs/dossier%20d'achitecture%20technique/security-review.md) | Revue de sécurité Sprint 6 (US-38) — rate limiting, secrets, HTTPS, dépendances |
| [docs/dossier d'achitecture technique/stratégies de testes/tests-e2e.md](docs/dossier%20d'achitecture%20technique/stratégies%20de%20testes/tests-e2e.md) | Plan des tests E2E Playwright (Sprint 7 / E10) |
| [docs/dossier d'achitecture technique/sprints/retro-sprint.md](docs/dossier%20d'achitecture%20technique/sprints/retro-sprint.md) | Rétrospective Sprints 2 & 3 |
| [docs/dossier d'achitecture technique/docker.md](docs/dossier%20d'achitecture%20technique/docker.md) | Lancer le projet en local avec Docker |
| [docs/dossier d'achitecture technique/render.md](docs/dossier%20d'achitecture%20technique/render.md) | Déploiement backend sur Render — Blueprint, variables d'environnement, superadmin par défaut |
| [docs/dossier d'achitecture technique/backups.md](docs/dossier%20d'achitecture%20technique/backups.md) | Sauvegardes PostgreSQL (US-37) — workflow GitHub Actions chiffré, restauration, option Render payant |

---

## 📁 Structure du projet (mono-repo)

Le projet est organisé en mono-repo GitHub avec deux dossiers principaux sous `code/` : `code/frontend/` (React) et `code/backend/` (Django). Cette organisation simplifie la gestion pour un développeur solo.

```
anifowoche/
├── code/
│   ├── frontend/             # Application React (src/, public/, package.json)
│   │   └── src/
│   │       ├── components/   # Navbar, Footer, MobileTabBar, ProductCard, ProductImage,
│   │       │                 # QuantityStepper, BottomSheet, PageSkeleton, ErrorFallback,
│   │       │                 # Seo, HeroSection, icons · account/ · seller/
│   │       ├── context/      # AuthContext, CartContext, SiteConfigContext (Context API)
│   │       ├── pages/        # Home, Catalogue, Product, Cart, Checkout, OrderConfirmation,
│   │       │                 # PublicOrder, ShopRedirect, PublicShop · Espace client :
│   │       │                 # Account, Orders, OrderDetail, Addresses, Wishlist ·
│   │       │                 # ANIF Seller : SellerAuth, SellerLanding, SellerDashboard,
│   │       │                 # SellerProducts, SellerProductDetail, SellerOrders,
│   │       │                 # SellerOrderDetail, SellerSettings
│   │       └── api/          # Fonctions Axios par domaine (products, orders, payments,
│   │                          # delivery, auth, reviews, content, promotions, returns,
│   │                          # wishlist, addresses, seller, store, analytics, siteConfig)
│   ├── backend/              # Projet Django (manage.py, requirements.txt)
│   │   ├── entrypoint.sh     # migrate + collectstatic + gunicorn (prod)
│   │   └── apps/
│   │       ├── products/     # Modèles, serializers, vues API — Produits (+ galerie, options)
│   │       ├── orders/       # Modèles, serializers, vues API — Commandes (+ coupons, guest checkout)
│   │       ├── payments/     # Intégration FedaPay (sandbox) + webhook + relance des paiements échoués
│   │       ├── users/        # Authentification JWT + profil (téléphone, préférence notif.)
│   │       ├── delivery/     # Zones/créneaux Cotonou, suivi de livraison
│   │       ├── notifications/ # Emails (Resend) + notifications backoffice (lues/non lues)
│   │       ├── reviews/      # Avis produits (lecture approuvés + soumission)
│   │       ├── content/      # Bannières carrousel accueil
│   │       ├── promotions/   # Promotions actives + validation coupons
│   │       ├── returns/      # Demandes de retour client
│   │       ├── wishlist/     # Liste de souhaits persistée
│   │       ├── sellers/      # ANIF Seller — profils vendeurs, boutiques publiques, commandes vendeur
│   │       ├── analytics/    # Statistiques et rapports admin (scopées boutique ets-anifowoche)
│   │       ├── appearance/   # Configuration du site (site-config) et personnalisation
│   │       └── core/         # Middleware, signaux, management commands, dashboard admin (core.dashboard)
│   └── docker-compose.yml
├── .github/                 # Templates issues, workflows CI/CD + sauvegarde BDD (db-backup.yml)
├── docs/                    # ANIFOWOCHE_boutique/ · dossier d'architecture technique/ · ANIF Seller/
└── README.md
```

---

## 🔌 API disponible (backend Django)

Toutes les routes sont préfixées par `/api/`. Détails complets des variables d'environnement et du déploiement : [docs/dossier d'achitecture technique/ci-cd.md](docs/dossier%20d'achitecture%20technique/ci-cd.md).

| Domaine | Endpoints | Accès |
|---------|-----------|-------|
| Produits | `GET /products/` (filtres prix/unité/stock/catégorie + tri + recherche), `GET /products/{slug}/` (note, remise, galerie), `GET /products/categories/` | Public |
| Commandes | `POST /orders/` (`coupon_code` optionnel, guest checkout possible) · `GET /orders/`, `GET /orders/{id}/` (items avec nom, slug et image produit) · `PATCH/DELETE` | Création publique/authentifiée · le client consulte ses propres commandes · modification/suppression réservées au staff |
| Paiement | `POST /payments/initiate/` (FedaPay sandbox) · `POST /payments/webhook/` (signature HMAC) · `GET /payments/` | Initiation publique, webhook signé · le client consulte les paiements de ses commandes, staff voit tout |
| Livraison | `GET /delivery/zones/`, `GET /delivery/slots/` · `POST /delivery/` (checkout) · `GET/PATCH /delivery/{id}/` | Lecture zones/créneaux publique, gestion réservée au staff |
| Authentification | `POST /auth/register/` (téléphone + préférence de notification optionnels), `POST /auth/token/`, `POST /auth/token/refresh/`, `GET /auth/me/` | Public / utilisateur connecté |
| Avis | `GET /reviews/?product__slug=...` (avis approuvés) · `POST /reviews/` (soumission, modération admin) | Public |
| Contenu | `GET /content/banners/` (bannières publiées, carrousel accueil) | Public |
| Promotions | `POST /promotions/coupons/validate/` (vérifie un code sans le consommer) | Public |
| Retours | `POST /returns/` (demande sur une commande possédée) · `GET /returns/` | Utilisateur connecté (scope à ses propres commandes) · staff voit tout |
| Wishlist | `GET /wishlist/`, `POST /wishlist/`, `DELETE /wishlist/{product_id}/` | Utilisateur connecté |
| Boutique publique | `GET /public/shops/{slug}/` · `GET /public/shops/{shop_slug}/products/{slug}/` | Public |
| Vendeur (ANIF Seller) | `POST /seller/register/` · `GET/PATCH /seller/profile/` · `GET /seller/dashboard/` · `GET/POST /seller/products/`, `GET/PATCH/DELETE /seller/products/{slug}/` (+ images, option-groups, options) · `GET /seller/orders/`, `PATCH /seller/orders/{id}/`, relance/confirmation de paiement · `GET /seller/shop/slug-availability/` | Vendeur authentifié |
| Analytics | `POST /analytics/pageview/` (tracking de pages vues) | Public (collecte anonyme) |
| Notifications | `GET/PATCH /notifications/settings/` (préférence de canal par commande) | Utilisateur connecté |
| Site config | `GET /site-config/` (config de la boutique pilotée par l'admin) | Public |
| Statut | `GET /store/status/` (état de la boutique) | Public |
| Notifications automatiques | déclenchées à la création de compte, commande reçue, facture, livraison — email (Resend) selon la préférence du client, plus email au vendeur à chaque nouvelle commande | — |

Dashboard admin frontend : route `/admin` (visible et accessible seulement aux comptes `is_staff`).
Dashboard vendeur : routes `/seller/*` (ANIF Seller), vitrine publique sur `seller.anifowoche.com/<slug>` avec CTA WhatsApp.

Superadmin créé automatiquement au déploiement (voir [docs/dossier d'achitecture technique/render.md](docs/dossier%20d'achitecture%20technique/render.md)) : identifiants par
défaut `anifowoche` / `Anifowoche123!` — changement de mot de passe forcé à la première connexion.

## ✅ Tests

Suite de tests Django avec `pytest` (300+ tests, appels externes FedaPay/WhatsApp/Resend mockés, coverage ≥ 80 %) :

```
docker compose -f code/docker-compose.yml exec backend pytest --cov=apps --cov-report=term-missing
```

## 🧑‍💻 ANIF Seller

SAAS de vitrine privée pour vendeurs, hébergé sous le sous-domaine `seller.anifowoche.com` :
dashboard de gestion (produits, commandes, paramètres) sur `anifowoche.com/seller/*`, vitrine publique
par vendeur avec CTA WhatsApp comme unique moyen de contact. Voir [docs/ANIFOWOCHE_boutique/ANIF Seller/](docs/ANIFOWOCHE_boutique/ANIF%20Seller/README.md).

---

## 📋 Contribuer

Ce projet est développé en solo (méthodologie Agile).
Toutes les tâches sont suivies via **[GitHub Projects](../../projects)**.

---

*Document mis à jour le 10 août 2026 — ANIFOWOCHE E-Commerce · Confidentiel*
