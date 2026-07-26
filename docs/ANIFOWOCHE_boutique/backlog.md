# 📋 Backlog Agile — Épics & User Stories

[← Retour au README](../README.md)

Priorités — **P1** : Critique · **P2** : Haute · **P3** : Normale

## E1 — Catalogue produits (Sprint 1)

| ID | User Story | Priorité | Points |
|----|-------------|----------|--------|
| US-01 | En tant que visiteur, je parcours les produits par catégorie (tissus, vêtements, accessoires) | P1 — Critique | 3 pts |
| US-02 | En tant que visiteur, je vois la fiche produit (photo, description, prix XOF, unité de vente pièce/mètre, taille si applicable) | P1 — Critique | 3 pts |
| US-03 | En tant qu'admin, je gère les produits (CRUD) depuis l'interface Django admin, y compris l'unité de vente (pièce ou mètre) | P1 — Critique | 2 pts |
| US-04 | En tant que visiteur, je recherche un produit par nom ou catégorie | P2 — Haute | 2 pts |

## E2 — Panier & commande (Sprint 1–2)

| ID | User Story | Priorité | Points |
|----|-------------|----------|--------|
| US-05 | En tant que client, j'ajoute des articles au panier et modifie les quantités | P1 — Critique | 2 pts |
| US-06 | En tant que client, je valide ma commande avec mon adresse de livraison à Cotonou | P1 — Critique | 3 pts |
| US-07 | En tant que client, je reçois un récapitulatif de commande par email ou SMS | P1 — Critique | 2 pts |
| US-08 | En tant qu'admin, je gère les statuts de commandes (reçue, préparée, livrée) | P2 — Haute | 3 pts |

## E3 — Paiement mobile money (Sprint 2)

| ID | User Story | Priorité | Points |
|----|-------------|----------|--------|
| US-09 | En tant que client, je paie via MTN Money ou Moov Money (FedaPay ou KkiaPay API) | P1 — Critique | 5 pts |
| US-10 | En tant que client, je paie par carte Visa / Mastercard | P2 — Haute | 3 pts |
| US-11 | En tant que client, je reçois une confirmation de paiement en temps réel | P2 — Haute | 2 pts |
| US-12 | En tant qu'admin, je consulte les statuts de paiements dans le dashboard | P3 — Normale | 1 pt |

## E4 — Livraison Cotonou (Sprint 3)

| ID | User Story | Priorité | Points |
|----|-------------|----------|--------|
| US-13 | En tant que client, je choisis un créneau de livraison et indique mon quartier à Cotonou | P1 — Critique | 3 pts |
| US-14 | En tant qu'admin, j'affecte une commande à un livreur et suis le statut | P2 — Haute | 3 pts |
| US-15 | En tant que client, je suis notifié (SMS ou WhatsApp) quand ma commande est en route | P2 — Haute | 2 pts |

## E5 — Compte client & lancement (Sprint 4)

| ID | User Story | Priorité | Points |
|----|-------------|----------|--------|
| US-16 | En tant que visiteur, je crée un compte avec mon téléphone ou email | P2 — Haute | 2 pts |
| US-17 | En tant que client, je consulte l'historique de mes commandes | P2 — Haute | 2 pts |
| US-18 | En tant que client, je sauvegarde mes adresses de livraison fréquentes | P3 — Normale | 1 pt |
| US-19 | En tant qu'admin, le site est sécurisé avant lancement (HTTPS, variables d'env., CORS) | P1 — Critique | 2 pts |
| US-20 | En tant que super admin, je gère les comptes admin que je crée (suppression, attribution de groupe/permissions) sans qu'un admin non-superuser puisse s'auto-promouvoir ou modifier d'autres comptes admin | P2 — Haute | 1 pt |

## E6 — Améliorations post-MVP

| ID | User Story | Priorité | Points |
|----|-------------|----------|--------|
| US-21 | En tant qu'admin, j'ajoute plusieurs images à un produit pour alimenter une galerie sur la fiche produit | P2 — Haute | 3 pts |

### Détails US-21 — Galerie multi-images produit

- Ajouter un modèle backend `ProductImage` lié à `Product`, avec `image`, `alt_text`, `position`, `is_primary` et dates de création/mise à jour.
- Garder le champ `Product.image` comme image principale pendant la transition, ou prévoir une migration qui crée automatiquement une première `ProductImage` à partir de l'image existante.
- Ajouter une interface inline dans l'admin Django pour gérer les images depuis la fiche produit : ajout, suppression, ordre d'affichage, choix de l'image principale.
- Exposer les images dans l'API produit, par exemple `images: [{ id, image, alt_text, position, is_primary }]`, en conservant `image` pour compatibilité avec les composants existants.
- Activer la galerie dans `Product.jsx` : vignettes desktop, points mobile, flèches précédent/suivant si plusieurs images, image principale sélectionnable.
- Adapter les cartes catalogue et panier pour continuer à utiliser l'image principale sans dépendre de toute la galerie.
- Prévoir des validations simples : formats image acceptés, taille maximale, ordre unique par produit, au moins une image principale si plusieurs images existent.
