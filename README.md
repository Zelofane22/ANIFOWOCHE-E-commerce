# 🛍️ ANIFOWOCHE — Plateforme e-commerce

> Boutique en ligne de tissus locaux, vêtements et accessoires homme — Cotonou, Bénin.

**Document de cadrage — Version 2.0 · Mai 2026 · Développeur solo (alternant ingénierie de production)**

| Statut | Durée MVP | Budget/mois | Zone cible |
|--------|-----------|-------------|------------|
| Sprint 1 en cours | ~3 mois (4 sprints) | 0 € (Render gratuit) | Cotonou, Bénin |

---

## 📖 Documentation

| Document | Contenu |
|----------|---------|
| [docs/contexte.md](docs/contexte.md) | Contexte, produits vendus, objectifs MVP, contraintes |
| [docs/stack-technique.md](docs/stack-technique.md) | Stack, architecture applicative, déploiement Render, outils |
| [docs/backlog.md](docs/backlog.md) | Backlog Agile — épics & user stories |
| [docs/maquettes.md](docs/maquettes.md) | Wireframes texte des écrans MVP (catalogue, fiche produit, panier, commande) |
| [docs/ci-cd.md](docs/ci-cd.md) | Structure CI/CD — GitHub Actions, déploiement Railway (backend) & Render (frontend) |
| [docs/sprints/planning.md](docs/sprints/planning.md) | Planning détaillé des 4 sprints |
| [docs/risques.md](docs/risques.md) | Analyse des risques et mitigations |
| [docs/docker.md](docs/docker.md) | Lancer le projet en local avec Docker |
| [docs/prochaines-etapes.md](docs/prochaines-etapes.md) | Actions immédiates avant le Sprint 1 |
| [docs/sprints/retro-sprint.md](docs/sprints/retro-sprint.md) | Modèle de rétrospective de sprint |

---

## 📁 Structure du projet (mono-repo)

Le projet est organisé en mono-repo GitHub avec deux dossiers principaux : `frontend/` (React) et `backend/` (Django). Cette organisation simplifie la gestion pour un développeur solo.

```
anifowoche/
├── frontend/                # Application React (src/, public/, package.json)
│   └── src/
│       ├── components/      # Composants réutilisables (Navbar, ProductCard, Cart...)
│       ├── pages/           # Pages : Home, Catalogue, Product, Checkout, Account
│       └── api/              # Fonctions Axios pour appeler le backend
├── backend/                 # Projet Django (manage.py, requirements.txt)
│   └── apps/
│       ├── products/        # Modèles, serializers, vues API — Produits
│       ├── orders/          # Modèles, serializers, vues API — Commandes
│       ├── payments/        # Intégration FedaPay / KkiaPay + webhooks
│       ├── users/           # Authentification JWT, profil client
│       └── delivery/        # Gestion livraisons Cotonou (zones, statuts)
├── .github/                 # Templates issues, workflows CI/CD (futur)
├── docs/                    # Sprints, rétrospectives, ADR (décisions d'architecture)
└── README.md
```

---

## 📋 Contribuer

Ce projet est développé en solo (méthodologie Agile).
Toutes les tâches sont suivies via **[GitHub Projects](../../projects)**.

---

*Document mis à jour le 30 juin 2026 — ANIFOWOCHE E-Commerce · Confidentiel*
