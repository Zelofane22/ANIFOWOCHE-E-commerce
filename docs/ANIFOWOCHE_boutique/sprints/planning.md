# 🗓️ Planning Agile — Sprints

[← Retour au README](../../README.md)

> Capacité : **7 h/semaine** (weekend). Sprint : 3 semaines = 21 h disponibles. Marge de 3 à 5 h intégrée par sprint pour absorber les imprévus d'alternance.

## Sprint 1 — Setup & Catalogue (Sem. 1–3 · 21h)

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

## Sprint 2 — Panier, Auth & Paiement (Sem. 4–6 · 21h)

| Tâche | Temps |
|-------|-------|
| Modèle Order + API commandes Django | 3h |
| Panier côté React (Context API ou Zustand) | 3h |
| Authentification JWT (inscription, connexion, tokens) | 3h |
| Intégration FedaPay API (sandbox MTN/Moov + webhook) | 5h |
| Page Checkout React + confirmation de commande | 3h |
| Déploiement initial sur Render (backend + BDD) et Vercel (frontend) | 1h |
| Marge / imprévus | 3h |
| **TOTAL** | **21h** |

**Livrable Sprint 2** : première commande test payée via FedaPay sandbox, déployée sur Render + Vercel.

## Sprint 3 — Livraison & Dashboard admin (Sem. 7–9 · 21h)

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

## Sprint 4 — Compte client, sécurité & lancement (Sem. 10–12 · 21h)

| Tâche | Temps |
|-------|-------|
| Espace client React : profil, historique commandes, adresses | 4h |
| Optimisation mobile (responsive Tailwind, performance) | 3h |
| Sécurité : HTTPS, CORS, variables d'env., rate limiting | 3h |
| Tests finaux complets (API + UI + paiement + livraison) | 4h |
| Lancement beta avec le père — premiers clients test | 2h |
| Marge / imprévus | 5h |
| **TOTAL** | **21h** |

**Livrable Sprint 4** : MVP en production sur Render + Vercel — ouverture aux premiers clients béninois.
