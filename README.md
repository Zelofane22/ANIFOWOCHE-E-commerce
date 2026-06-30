# 🛍️ ANIFOWOCHE — Plateforme e-commerce

> Boutique en ligne de tissus locaux, vêtements et accessoires homme — Cotonou, Bénin.

**Document de cadrage — Version 2.0 · Mai 2026 · Développeur solo (alternant ingénierie de production)**

| Statut | Durée MVP | Budget/mois | Zone cible |
|--------|-----------|-------------|------------|
| Sprint 1 en cours | ~3 mois (4 sprints) | 0 € (Render gratuit) | Cotonou, Bénin |

---

## 📌 1. Présentation du projet

### 1.1 Contexte

ANIFOWOCHE digitalise un commerce physique de tissus et vêtements pour hommes au Bénin. L'objectif est de livrer une plateforme e-commerce complète, développée sur mesure, intégrant les paiements mobile money locaux et la livraison à domicile sur Cotonou.

### 1.2 Produits vendus

- **Tissus locaux** : bazin, googluck
- **Vêtements homme casual** : chemises, pantalons, dessous
- **Accessoires** : montres, ceintures, chaussures ouvertes, mocassins

### 1.3 Objectifs du MVP

- Application web React (SPA) — catalogue, panier, commande, espace client
- API REST Django — gestion produits, commandes, paiements, livraisons
- Base de données PostgreSQL — stockage structuré et fiable
- Paiement via MTN Money, Moov Money et carte bancaire (FedaPay / KkiaPay)
- Livraison à domicile sur Cotonou
- Déploiement initial gratuit sur Render, migration Hostinger en phase 2

### 1.4 Contraintes

- Développeur solo en alternance ingénierie de production
- Capacité : 7 heures/semaine (principalement le weekend)
- Budget hébergement MVP : 0 € (Render gratuit)
- Phase 1 : web uniquement — application mobile React Native en phase 3

---

## 🛠️ 2. Stack technique

### 2.1 Vue d'ensemble

| Couche | Technologie | Version cible | Rôle |
|--------|-------------|----------------|------|
| Frontend | React + React Router + Axios | React 18+ | Interface utilisateur (SPA) |
| UI / Style | Tailwind CSS | v3 | Design system responsive |
| Backend | Django + Django REST Framework | Django 5+ | API REST, logique métier |
| Base de données | PostgreSQL | v16+ | Stockage persistant |
| Authentification | JWT (djangorestframework-simplejwt) | — | Sessions client sécurisées |
| Paiement | FedaPay API / KkiaPay API | — | MTN Money, Moov, Visa/MC |
| Hébergement MVP | Render (gratuit) | Free tier | Backend + BDD + Frontend |
| Hébergement prod. | Hostinger (phase 2) | ~3,99 €/mois | Migration après validation |

### 2.2 Architecture applicative

L'application suit une architecture découplée : le frontend React communique exclusivement avec le backend Django via une API REST JSON. Le backend gère la logique métier, l'authentification JWT et les appels aux passerelles de paiement. PostgreSQL assure la persistance.

- **Frontend (React)** : Pages Accueil, Catalogue, Produit, Panier, Commande, Compte · State management (Context API ou Zustand) · Axios pour les appels API
- **Backend (Django)** : API `/products/` `/orders/` `/payments/` `/users/` `/delivery/` · ORM Django → PostgreSQL · Authentification JWT
- **Externe** : FedaPay / KkiaPay (paiement) · Render (hébergement gratuit) · WhatsApp Business (notifications)

### 2.3 Déploiement Render (MVP gratuit)

| Service Render | Ce qu'il héberge | Limites free tier |
|-----------------|-------------------|---------------------|
| Web Service | Backend Django (API REST) | Mise en veille après 15 min d'inactivité |
| Static Site | Frontend React (build) | Aucune — illimité |
| PostgreSQL | Base de données | 1 Go stockage, 90 jours gratuits |

> La mise en veille du backend Render en free tier ralentit la première requête après inactivité (~30 s). C'est acceptable pour un prototype — la migration vers Hostinger ou un VPS interviendra avant l'ouverture au public.

### 2.4 Outils de développement & communication

| Outil | Usage | Coût |
|-------|-------|------|
| GitHub + GitHub Projects | Versionnage du code + backlog Agile (kanban) | Gratuit |
| VS Code | Éditeur de code principal | Gratuit |
| Postman / Thunder Client | Test des endpoints API Django | Gratuit |
| WhatsApp Business | Communication avec le père + support client + notifications livraison | Gratuit |
| Canva | Visuels produits, bannières, posts WhatsApp | Gratuit |

**Coût mensuel total MVP : 0 €/mois** (hors frais de transaction FedaPay à la vente)

---

## 📁 3. Structure du projet (mono-repo)

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

## 📋 4. Backlog Agile — Épics & User Stories

Priorités — **P1** : Critique · **P2** : Haute · **P3** : Normale

### E1 — Catalogue produits (Sprint 1)

| ID | User Story | Priorité | Points |
|----|-------------|----------|--------|
| US-01 | En tant que visiteur, je parcours les produits par catégorie (tissus, vêtements, accessoires) | P1 — Critique | 3 pts |
| US-02 | En tant que visiteur, je vois la fiche produit (photo, description, prix XOF, tailles) | P1 — Critique | 3 pts |
| US-03 | En tant qu'admin, je gère les produits (CRUD) depuis l'interface Django admin | P1 — Critique | 2 pts |
| US-04 | En tant que visiteur, je recherche un produit par nom ou catégorie | P2 — Haute | 2 pts |

### E2 — Panier & commande (Sprint 1–2)

| ID | User Story | Priorité | Points |
|----|-------------|----------|--------|
| US-05 | En tant que client, j'ajoute des articles au panier et modifie les quantités | P1 — Critique | 2 pts |
| US-06 | En tant que client, je valide ma commande avec mon adresse de livraison à Cotonou | P1 — Critique | 3 pts |
| US-07 | En tant que client, je reçois un récapitulatif de commande par email ou SMS | P1 — Critique | 2 pts |
| US-08 | En tant qu'admin, je gère les statuts de commandes (reçue, préparée, livrée) | P2 — Haute | 3 pts |

### E3 — Paiement mobile money (Sprint 2)

| ID | User Story | Priorité | Points |
|----|-------------|----------|--------|
| US-09 | En tant que client, je paie via MTN Money ou Moov Money (FedaPay ou KkiaPay API) | P1 — Critique | 5 pts |
| US-10 | En tant que client, je paie par carte Visa / Mastercard | P2 — Haute | 3 pts |
| US-11 | En tant que client, je reçois une confirmation de paiement en temps réel | P2 — Haute | 2 pts |
| US-12 | En tant qu'admin, je consulte les statuts de paiements dans le dashboard | P3 — Normale | 1 pt |

### E4 — Livraison Cotonou (Sprint 3)

| ID | User Story | Priorité | Points |
|----|-------------|----------|--------|
| US-13 | En tant que client, je choisis un créneau de livraison et indique mon quartier à Cotonou | P1 — Critique | 3 pts |
| US-14 | En tant qu'admin, j'affecte une commande à un livreur et suis le statut | P2 — Haute | 3 pts |
| US-15 | En tant que client, je suis notifié (SMS ou WhatsApp) quand ma commande est en route | P2 — Haute | 2 pts |

### E5 — Compte client & lancement (Sprint 4)

| ID | User Story | Priorité | Points |
|----|-------------|----------|--------|
| US-16 | En tant que visiteur, je crée un compte avec mon téléphone ou email | P2 — Haute | 2 pts |
| US-17 | En tant que client, je consulte l'historique de mes commandes | P2 — Haute | 2 pts |
| US-18 | En tant que client, je sauvegarde mes adresses de livraison fréquentes | P3 — Normale | 1 pt |
| US-19 | En tant qu'admin, le site est sécurisé avant lancement (HTTPS, variables d'env., CORS) | P1 — Critique | 2 pts |

---

## 🗓️ 5. Planning Agile — Sprints

> Capacité : **7 h/semaine** (weekend). Sprint : 3 semaines = 21 h disponibles. Marge de 3 à 5 h intégrée par sprint pour absorber les imprévus d'alternance.

### Sprint 1 — Setup & Catalogue (Sem. 1–3 · 21h)

| Tâche | Temps |
|-------|-------|
| Initialiser le repo GitHub (mono-repo frontend + backend) | 1h |
| Setup Django + DRF + PostgreSQL local (venv, migrations) | 3h |
| Setup React + Tailwind CSS + React Router | 2h |
| Modèles Django : Product, Category — API CRUD `/products/` | 4h |
| Pages React : Accueil, Catalogue, Fiche produit | 5h |
| Tests API avec Postman + rétrospective sprint | 3h |
| Marge / imprévus | 3h |
| **TOTAL** | **21h** |

**Livrable Sprint 1** : API produits fonctionnelle + catalogue React affichant les produits réels.

### Sprint 2 — Panier, Auth & Paiement (Sem. 4–6 · 21h)

| Tâche | Temps |
|-------|-------|
| Modèle Order + API commandes Django | 3h |
| Panier côté React (Context API ou Zustand) | 3h |
| Authentification JWT (inscription, connexion, tokens) | 3h |
| Intégration FedaPay API (sandbox MTN/Moov + webhook) | 5h |
| Page Checkout React + confirmation de commande | 3h |
| Déploiement initial sur Render (backend + frontend + BDD) | 1h |
| Marge / imprévus | 3h |
| **TOTAL** | **21h** |

**Livrable Sprint 2** : première commande test payée via FedaPay sandbox, déployée sur Render.

### Sprint 3 — Livraison & Dashboard admin (Sem. 7–9 · 21h)

| Tâche | Temps |
|-------|-------|
| Modèle Delivery + API zones/créneaux Cotonou | 4h |
| Formulaire adresse livraison + créneau (React) | 3h |
| Notifications SMS/WhatsApp client (API ou plugin) | 3h |
| Dashboard admin React : commandes + paiements + livraisons | 5h |
| Tests de bout en bout + rétrospective | 3h |
| Marge / imprévus | 3h |
| **TOTAL** | **21h** |

**Livrable Sprint 3** : flux commande complet de bout en bout, tableau de bord opérationnel.

### Sprint 4 — Compte client, sécurité & lancement (Sem. 10–12 · 21h)

| Tâche | Temps |
|-------|-------|
| Espace client React : profil, historique commandes, adresses | 4h |
| Optimisation mobile (responsive Tailwind, performance) | 3h |
| Sécurité : HTTPS, CORS, variables d'env., rate limiting | 3h |
| Tests finaux complets (API + UI + paiement + livraison) | 4h |
| Lancement beta avec le père — premiers clients test | 2h |
| Marge / imprévus | 5h |
| **TOTAL** | **21h** |

**Livrable Sprint 4** : MVP en production sur Render — ouverture aux premiers clients béninois.

---

## ⚠️ 6. Analyse des risques

| Risque | Probabilité | Impact | Mitigation |
|--------|--------------|--------|------------|
| Intégration FedaPay API complexe (webhooks, sandbox) | Haute | Élevé | Dédier 5h au sprint 2, tester en sandbox dès le sprint 1 |
| Render gratuit : mise en veille du backend (30 s) | Certaine | Faible | Acceptable pour prototype — migration Hostinger avant lancement réel |
| Weekend indisponible (partiels, fatigue alternance) | Moyenne | Moyen | Marge de 3h/sprint + durée sprint 3 semaines |
| Logistique livraison Cotonou non définie | Haute | Élevé | Définir le processus (livreur, zones, prix) avant le sprint 3 |
| Démarches administratives FedaPay longues | Haute | Élevé | Lancer l'inscription FedaPay dès le sprint 1 en parallèle |
| Courbe d'apprentissage Django REST Framework | Moyenne | Moyen | Prévoir 2h/sprint pour documentation + tutoriels DRF |

---

## ✅ 7. Prochaines étapes immédiates

Actions avant le démarrage du Sprint 1 :

- Créer le repo GitHub mono-repo `anifowoche` (`frontend/` + `backend/`)
- Installer Python, Node.js, PostgreSQL en local
- Créer et configurer le projet GitHub Projects (kanban sprint 1)
- Lancer l'inscription sur FedaPay (vérification commerciale Bénin)
- Demander au père d'installer WhatsApp Business et prendre les premières photos produits

**Date cible lancement MVP : Août 2026**

---

## 📋 Contribuer

Ce projet est développé en solo (méthodologie Agile).
Toutes les tâches sont suivies via **[GitHub Projects](../../projects)**.

---

*Document mis à jour le 21 mai 2026 — ANIFOWOCHE E-Commerce · Confidentiel*
