# ANIF Seller

[← Retour aux docs](../)

## Vision

ANIF Seller est une application web SaaS destinée aux petits vendeurs qui vendent déjà sur WhatsApp, Instagram, Facebook ou en boutique physique, mais qui gèrent encore leurs commandes de façon manuelle.

L'idée n'est pas de remplacer WhatsApp. L'idée est de transformer les conversations et les commandes informelles en un système simple : catalogue, lien boutique, suivi des commandes, stock, clients, paiements et relances.

## Promesse

> Aider un vendeur à passer de "je note les commandes dans WhatsApp" à "je pilote mes ventes dans un vrai tableau de bord".

## Accès public cible

Le SaaS ANIF Seller doit être accessible depuis le sous-domaine :

```text
https://sell.anifowoche.com
```

Ce sous-domaine doit pointer vers le frontend ANIF Seller déployé sur Vercel. Le backend Django reste exposé via son URL API Render ou un domaine API dédié, mais il doit autoriser `https://sell.anifowoche.com` dans les variables `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` et `FRONTEND_BASE_URL`.

## Cible prioritaire

- Vendeurs de vêtements, tissus, chaussures, accessoires, cosmétiques ou repas
- Petits commerces au Bénin et en Afrique francophone
- Vendeurs qui reçoivent déjà des commandes via WhatsApp ou Instagram
- Entrepreneurs qui n'ont pas le budget ou le temps pour créer un vrai site e-commerce

## Documentation

| Fichier | Contenu |
|---------|---------|
| [01-concept.md](01-concept.md) | Concept produit, problème, solution, différenciation |
| [02-utilisateurs-et-problemes.md](02-utilisateurs-et-problemes.md) | Personas, douleurs terrain, besoins prioritaires |
| [03-mvp.md](03-mvp.md) | Périmètre du MVP et fonctionnalités à construire en premier |
| [04-modele-economique.md](04-modele-economique.md) | Tarification, sources de revenus, stratégie commerciale |
| [05-roadmap.md](05-roadmap.md) | Roadmap progressive du MVP jusqu'au SaaS complet |
| [06-reutilisation-anifowoche.md](06-reutilisation-anifowoche.md) | Comment réutiliser le projet ANIFOWOCHE existant |
| [07-methode-agile.md](07-methode-agile.md) | Organisation Agile adaptée au produit SaaS |
| [08-backlog-agile.md](08-backlog-agile.md) | Épics, user stories, priorités et estimation initiale |
| [09-sprint-0-recherche-ia.md](09-sprint-0-recherche-ia.md) | Sprint 0 sans interviews : recherches internet, benchmark et cadrage IA |

## État d'avancement du projet

### Sprint en cours — Sprint 5 : Beta payante

| User Story | Statut |
|---|---|
| US-701 — Afficher les plans disponibles | ✅ Terminé (landing pricing) |
| US-702 — Limiter le plan gratuit | ⚠️ Modèle uniquement (pas d'enforcement) |
| US-703 — Afficher les limites produit/commande | ❌ Non implémenté |
| US-704 — Suivre les vendeurs actifs | ❌ Non implémenté |

### Sprints terminés

- **Sprint 4** — WhatsApp assisté ✅ _(confirmation commande, relance paiement, rupture de stock, liens wa.me)_
- **Sprint 3** — Commandes vendeur ✅ _(commande publique, liste commandes, changement statut, annulation, détail commande)_
- **Sprint 2** — Catalogue produits ✅ _(CRUD produit, image principale, galerie, stock, catégorie, boutique publique, couleurs)_
- **Sprint 1** — Compte vendeur et boutique ✅ _(inscription, connexion, profil, lien public, dashboard)_

### Fonctionnalités bonus livrées

| Fonctionnalité | Statut |
|---|---|
| Dashboard vendeur avec KPIs (chiffre d'affaires, graphiques, top produits, alertes stock) | ✅ |
| Confirmation de paiement vendeur | ✅ |
| Relance de paiement (FedaPay) depuis le seller | ✅ |
| Page de landing marketing ANIF Seller | ✅ |
| Shell SaaS dédié (sidebar, navigation séparée) | ✅ |
| Filtres catégorie sur boutique publique | ✅ |

### Pas encore implémenté

- Gestion des clients vendeur
- Système d'abonnement/billing
- Logo boutique par vendeur
- Export CSV des commandes
- Analytics avancés, rôles d'équipe, domaine personnalisé

## Positionnement simple

ANIF Seller peut être présenté comme :

- un mini Shopify adapté aux vendeurs WhatsApp ;
- un tableau de bord de commandes pour petits commerces ;
- un outil simple pour créer une boutique partageable sans savoir coder ;
- une passerelle progressive vers les paiements Mobile Money et la livraison organisée.

## Objectif business

Construire un outil suffisamment simple pour être adopté par des vendeurs non techniques, puis le monétiser avec un abonnement mensuel accessible et des options premium.

## Mode de développement

L'application sera développée avec l'aide de l'IA. Les premiers sprints doivent donc privilégier des livrables très concrets : briefs courts, maquettes, user stories testables, prompts de génération, prototypes vérifiables et décisions documentées.

# compte de test local
username: testvendeur1785062520
email:   testvendeur1785062520@example.com
password: TestVendeur123!
shop:    Boutique Test → /shop/boutique-test-1785062520