# 🛍️ ANIFOWOCHE — Plateforme e-commerce

> Boutique en ligne de tissus locaux, vêtements et accessoires homme — Cotonou, Bénin.

**Document de cadrage — Version 2.0 · Mai 2026 · Développeur solo (alternant ingénierie de production)**

| Statut | Durée MVP | Budget/mois | Zone cible |
|--------|-----------|-------------|------------|
| MVP terminé (Sprints 1-4) · Sprint 5 (E6+E7) terminé · Sprint 6 (E9) partiel — rôles admin + revue sécurité faits, monitoring Sentry intégré (DSN à renseigner), paiement/WhatsApp réels en attente de clés externes · Espace client refondu (maquette Figma) | ~3 mois (4 sprints MVP) | 0 € (Render gratuit) | Cotonou, Bénin |

---

## 📖 Documentation

| Document | Contenu |
|----------|---------|
| [docs/contexte.md](docs/contexte.md) | Contexte, produits vendus, objectifs MVP, contraintes |
| [docs/stack-technique.md](docs/stack-technique.md) | Stack, architecture applicative, déploiement Render, outils |
| [docs/backlog.md](docs/backlog.md) | Backlog Agile MVP (terminé) — épics & user stories E1-E5 |
| [docs/backlog-v2.md](docs/backlog-v2.md) | Backlog v2 (post-MVP) — épics & user stories E6-E13, toutes vérifiées contre l'état réel du code |
| [docs/maquettes.md](docs/maquettes.md) | Wireframes texte des écrans MVP (catalogue, fiche produit, panier, commande) |
| [docs/ci-cd.md](docs/ci-cd.md) | Structure CI/CD — GitHub Actions, déploiement Render (backend) & Vercel (frontend) |
| [docs/sprints/planning.md](docs/sprints/planning.md) | Planning détaillé des 4 sprints MVP (terminé) |
| [docs/sprints/planning-v2.md](docs/sprints/planning-v2.md) | Planning v2 (post-MVP) — sprints 5+ par priorité/dépendance, sans capacité horaire fixe |
| [docs/sprints/sprint5-progress.md](docs/sprints/sprint5-progress.md) | Suivi des tâches Sprint 5 (terminé) |
| [docs/sprints/sprint6-progress.md](docs/sprints/sprint6-progress.md) | Suivi des tâches Sprint 6 (partiel — rôles admin + sécurité faits, reste en attente de clés externes) |
| [docs/security-review.md](docs/security-review.md) | Revue de sécurité Sprint 6 (US-38) — rate limiting, secrets, HTTPS, dépendances |
| [docs/sprints/retro-sprint.md](docs/sprints/retro-sprint.md) | Rétrospective Sprints 2 & 3 |
| [docs/risques.md](docs/risques.md) | Analyse des risques et mitigations |
| [docs/docker.md](docs/docker.md) | Lancer le projet en local avec Docker |
| [docs/render.md](docs/render.md) | Déploiement backend sur Render — Blueprint, variables d'environnement, superadmin par défaut |
| [docs/backups.md](docs/backups.md) | Sauvegardes PostgreSQL (US-37) — workflow GitHub Actions chiffré, restauration, option Render payant |

---

## 📁 Structure du projet (mono-repo)

Le projet est organisé en mono-repo GitHub avec deux dossiers principaux sous `code/` : `code/frontend/` (React) et `code/backend/` (Django). Cette organisation simplifie la gestion pour un développeur solo.

```
anifowoche/
├── code/
│   ├── frontend/             # Application React (src/, public/, package.json)
│   │   └── src/
│   │       ├── components/   # Navbar, ProductCard, QuantityStepper, icons,
│   │       │                 # account/ (badges statut, garde d'auth)
│   │       ├── context/       # CartContext, AuthContext (Context API)
│   │       ├── pages/        # Home, Catalogue, Product, Cart, Checkout,
│   │       │                 # OrderConfirmation · Espace client : Account,
│   │       │                 # Orders, OrderDetail, Addresses, Wishlist
│   │       └── api/           # Fonctions Axios par domaine (products, orders,
│   │                          # payments, delivery, auth, reviews, content,
│   │                          # promotions, returns, wishlist)
│   ├── backend/              # Projet Django (manage.py, requirements.txt)
│   │   ├── entrypoint.sh     # migrate + collectstatic + gunicorn (prod)
│   │   └── apps/
│   │       ├── products/     # Modèles, serializers, vues API — Produits (+ galerie)
│   │       ├── orders/       # Modèles, serializers, vues API — Commandes (+ coupons)
│   │       ├── payments/     # Intégration FedaPay (sandbox) + webhook
│   │       ├── users/        # Authentification JWT + profil (téléphone, préférence notif.)
│   │       ├── delivery/     # Zones/créneaux Cotonou, suivi de livraison
│   │       ├── notifications/ # WhatsApp Business + email (Resend), selon préférence client
│   │       ├── reviews/      # Avis produits (lecture approuvés + soumission)
│   │       ├── content/      # Bannières carrousel accueil
│   │       ├── promotions/   # Promotions actives + validation coupons
│   │       ├── returns/      # Demandes de retour client
│   │       └── wishlist/     # Liste de souhaits persistée
│   └── docker-compose.yml
├── .github/                 # Templates issues, workflows CI/CD
├── docs/                    # Sprints, rétrospectives, ADR (décisions d'architecture)
└── README.md
```

---

## 🔌 API disponible (backend Django)

Toutes les routes sont préfixées par `/api/`. Détails complets des variables d'environnement et du déploiement : [docs/ci-cd.md](docs/ci-cd.md).

| Domaine | Endpoints | Accès |
|---------|-----------|-------|
| Produits | `GET /products/` (filtres prix/unité/stock/catégorie + tri + recherche), `GET /products/{slug}/` (note, remise, galerie), `GET /products/categories/` | Public |
| Commandes | `POST /orders/` (compte requis, `coupon_code` optionnel) · `GET /orders/`, `GET /orders/{id}/` (items avec nom, slug et image produit) · `PATCH/DELETE` | Création authentifiée · le client consulte ses propres commandes · modification/suppression réservées au staff |
| Paiement | `POST /payments/initiate/` (FedaPay sandbox) · `POST /payments/webhook/` (signature HMAC) · `GET /payments/` | Initiation publique, webhook signé · le client consulte les paiements de ses commandes, staff voit tout |
| Livraison | `GET /delivery/zones/`, `GET /delivery/slots/` · `POST /delivery/` (checkout) · `GET/PATCH /delivery/{id}/` | Lecture zones/créneaux publique, gestion réservée au staff |
| Authentification | `POST /auth/register/` (téléphone + préférence de notification optionnels), `POST /auth/token/`, `POST /auth/token/refresh/`, `GET /auth/me/` | Public / utilisateur connecté |
| Avis | `GET /reviews/?product__slug=...` (avis approuvés) · `POST /reviews/` (soumission, modération admin) | Public |
| Contenu | `GET /content/banners/` (bannières publiées, carrousel accueil) | Public |
| Promotions | `POST /promotions/coupons/validate/` (vérifie un code sans le consommer) | Public |
| Retours | `POST /returns/` (demande sur une commande possédée) · `GET /returns/` | Utilisateur connecté (scope à ses propres commandes) · staff voit tout |
| Wishlist | `GET /wishlist/`, `POST /wishlist/`, `DELETE /wishlist/{product_id}/` | Utilisateur connecté |
| Notifications | déclenchées automatiquement (création de compte, commande reçue, facture, livraison en route/livrée) — WhatsApp ou email (Resend) selon la préférence du client, pas d'endpoint direct | — |

Dashboard admin frontend : route `/admin` (visible et accessible seulement aux comptes `is_staff`).

Superadmin créé automatiquement au déploiement (voir [docs/render.md](docs/render.md)) : identifiants par
défaut `anifowoche` / `Anifowoche123!` — changement de mot de passe forcé à la première connexion.

## ✅ Tests

Suite de tests Django (77 tests, appels externes FedaPay/WhatsApp/Resend mockés) :

```
docker compose -f code/docker-compose.yml exec backend python manage.py test
```

---

## 📋 Contribuer

Ce projet est développé en solo (méthodologie Agile).
Toutes les tâches sont suivies via **[GitHub Projects](../../projects)**.

---

*Document mis à jour le 3 juillet 2026 — ANIFOWOCHE E-Commerce · Confidentiel*
