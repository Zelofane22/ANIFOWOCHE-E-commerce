# 🛠️ Stack technique

[← Retour au README](../README.md)

## Vue d'ensemble

| Couche | Technologie | Version cible | Rôle |
|--------|-------------|----------------|------|
| Frontend | React + React Router + Axios | React 18+ | Interface utilisateur (SPA) |
| UI / Style | Tailwind CSS | v3 | Design system responsive |
| Backend | Django + Django REST Framework | Django 5+ | API REST, logique métier |
| Base de données | PostgreSQL | v16+ | Stockage persistant |
| Authentification | JWT (djangorestframework-simplejwt) | — | Sessions client sécurisées |
| Paiement | FedaPay API / KkiaPay API | — | MTN Money, Moov, Visa/MC |
| Hébergement backend | Railway | Free/Hobby tier | API Django + PostgreSQL |
| Hébergement frontend | Render (Static Site) | Free tier | Build React/Vite |
| Hébergement prod. | Hostinger (phase 2) | ~3,99 €/mois | Migration après validation |

## Architecture applicative

L'application suit une architecture découplée : le frontend React communique exclusivement avec le backend Django via une API REST JSON. Le backend gère la logique métier, l'authentification JWT et les appels aux passerelles de paiement. PostgreSQL assure la persistance.

- **Frontend (React)** : Pages Accueil, Catalogue, Produit, Panier, Commande, Compte · State management (Context API ou Zustand) · Axios pour les appels API
- **Backend (Django)** : API `/products/` `/orders/` `/payments/` `/users/` `/delivery/` · ORM Django → PostgreSQL · Authentification JWT
- **Externe** : FedaPay / KkiaPay (paiement) · Railway (backend) · Render (frontend) · WhatsApp Business (notifications)

## Déploiement Railway + Render (MVP)

| Plateforme | Ce qu'elle héberge | Déclenchement |
|-----------------|-------------------|---------------------|
| Railway | Backend Django (API REST) + PostgreSQL | Déploiement auto sur push `main` (intégration GitHub native) |
| Render — Static Site | Frontend React (build Vite) | Déploiement auto sur push `main` (intégration GitHub native) |

Détails complets du pipeline CI/CD et des variables d'environnement : [docs/ci-cd.md](ci-cd.md).

> Le comportement de mise en veille dépend du tier choisi sur chaque plateforme — à vérifier avant le lancement public. La migration vers Hostinger ou un VPS reste prévue en phase 2 si le trafic le justifie.

## Outils de développement & communication

| Outil | Usage | Coût |
|-------|-------|------|
| GitHub + GitHub Projects | Versionnage du code + backlog Agile (kanban) | Gratuit |
| VS Code | Éditeur de code principal | Gratuit |
| Postman / Thunder Client | Test des endpoints API Django | Gratuit |
| WhatsApp Business | Communication avec le père + support client + notifications livraison | Gratuit |
| Canva | Visuels produits, bannières, posts WhatsApp | Gratuit |

**Coût mensuel total MVP : 0 €/mois** (hors frais de transaction FedaPay à la vente)

## Améliorations envisagées — Phase 2

| Évolution | Rôle | Pourquoi pas au MVP |
|-----------|------|----------------------|
| Redis + Celery | Broker asynchrone pour les webhooks FedaPay/KkiaPay et les notifications SMS/WhatsApp ; cache applicatif si le trafic le justifie | Auth JWT stateless → pas besoin de sessions serveur ; cache mémoire Django suffisant au trafic actuel ; pas de free tier Redis sur Render (contraire au budget 0 €/mois) |

À réévaluer une fois le trafic réel observé après le lancement beta (voir [docs/sprints/planning.md](sprints/planning.md) — Sprint 4).
