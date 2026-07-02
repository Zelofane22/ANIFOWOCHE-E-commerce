# 🛍️ ANIFOWOCHE — Plateforme e-commerce

> Boutique en ligne de tissus locaux, vêtements et accessoires homme — Cotonou, Bénin.

**Document de cadrage — Version 2.0 · Mai 2026 · Développeur solo (alternant ingénierie de production)**

| Statut | Durée MVP | Budget/mois | Zone cible |
|--------|-----------|-------------|------------|
| Sprints 1 à 3 terminés · Sprint 4 à venir | ~3 mois (4 sprints) | 0 € (Render gratuit) | Cotonou, Bénin |

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
| [docs/sprints/sprint2-progress.md](docs/sprints/sprint2-progress.md) | Suivi des tâches Sprint 2 (terminé) |
| [docs/sprints/sprint3-progress.md](docs/sprints/sprint3-progress.md) | Suivi des tâches Sprint 3 (terminé) |
| [docs/sprints/retro-sprint.md](docs/sprints/retro-sprint.md) | Rétrospective Sprints 2 & 3 |
| [docs/risques.md](docs/risques.md) | Analyse des risques et mitigations |
| [docs/docker.md](docs/docker.md) | Lancer le projet en local avec Docker |
| [docs/prochaines-etapes.md](docs/prochaines-etapes.md) | Actions immédiates avant le Sprint 1 |

---

## 📁 Structure du projet (mono-repo)

Le projet est organisé en mono-repo GitHub avec deux dossiers principaux sous `code/` : `code/frontend/` (React) et `code/backend/` (Django). Cette organisation simplifie la gestion pour un développeur solo.

```
anifowoche/
├── code/
│   ├── frontend/             # Application React (src/, public/, package.json)
│   │   └── src/
│   │       ├── components/   # Navbar, ProductCard, QuantityStepper...
│   │       ├── context/       # CartContext, AuthContext (Context API)
│   │       ├── pages/        # Home, Catalogue, Product, Cart, Checkout,
│   │       │                 # OrderConfirmation, Account, Dashboard (admin)
│   │       └── api/           # Fonctions Axios par domaine (products, orders,
│   │                          # payments, delivery, auth)
│   ├── backend/              # Projet Django (manage.py, requirements.txt)
│   │   ├── entrypoint.sh     # migrate + collectstatic + gunicorn (prod)
│   │   └── apps/
│   │       ├── products/     # Modèles, serializers, vues API — Produits
│   │       ├── orders/       # Modèles, serializers, vues API — Commandes
│   │       ├── payments/     # Intégration FedaPay (sandbox) + webhook
│   │       ├── users/        # Authentification JWT (inscription, connexion)
│   │       ├── delivery/     # Zones/créneaux Cotonou, suivi de livraison
│   │       └── notifications/ # Client WhatsApp Business (confirmation, en route)
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
| Produits | `GET /products/`, `GET /products/{slug}/`, `GET /products/categories/` | Public |
| Commandes | `POST /orders/` (checkout invité) · `GET/PATCH /orders/{id}/`, `GET /orders/` | Création publique · lecture/gestion réservées au staff |
| Paiement | `POST /payments/initiate/` (FedaPay sandbox) · `POST /payments/webhook/` (signature HMAC) · `GET /payments/` | Initiation publique, webhook signé, liste réservée au staff |
| Livraison | `GET /delivery/zones/`, `GET /delivery/slots/` · `POST /delivery/` (checkout) · `GET/PATCH /delivery/{id}/` | Lecture zones/créneaux publique, gestion réservée au staff |
| Authentification | `POST /auth/register/`, `POST /auth/token/`, `POST /auth/token/refresh/`, `GET /auth/me/` | Public / utilisateur connecté |
| Notifications | déclenchées automatiquement (confirmation de commande, livraison en route) — pas d'endpoint direct | — |

Dashboard admin frontend : route `/admin` (visible et accessible seulement aux comptes `is_staff`).

Cred anifowoche/Anifowoche123!

## ✅ Tests

Suite de tests Django (29 tests, appels externes FedaPay/WhatsApp mockés) :

```
docker compose -f code/docker-compose.yml exec backend python manage.py test
```

---

## 📋 Contribuer

Ce projet est développé en solo (méthodologie Agile).
Toutes les tâches sont suivies via **[GitHub Projects](../../projects)**.

---

*Document mis à jour le 1er juillet 2026 — ANIFOWOCHE E-Commerce · Confidentiel*
