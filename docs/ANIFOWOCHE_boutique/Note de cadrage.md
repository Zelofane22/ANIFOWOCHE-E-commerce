# 📌 Présentation du projet

[← Retour au README](../README.md)

## Contexte

ANIFOWOCHE digitalise un commerce physique de tissus et vêtements pour hommes au Bénin. L'objectif est de livrer une plateforme e-commerce complète, développée sur mesure, intégrant les paiements mobile money locaux et la livraison à domicile sur Cotonou.

## Produits vendus

- **Tissus locaux** : bazin, googluck — vendus au mètre (pas de taille S/M/L)
- **Vêtements homme casual** : chemises, pantalons, dessous — vendus à la pièce, avec taille (S/M/L/XL ou taille unique)
- **Accessoires** : montres, ceintures, chaussures ouvertes, mocassins — vendus à la pièce

## Objectifs du MVP

- Application web React (SPA) — catalogue, panier, commande, espace client
- API REST Django — gestion produits, commandes, paiements, livraisons
- Base de données PostgreSQL — stockage structuré et fiable
- Paiement via MTN Money, Moov Money et carte bancaire (FedaPay / KkiaPay)
- Livraison à domicile sur Cotonou
- Déploiement initial sur Render (backend + BDD) et Vercel (frontend), migration Hostinger en phase 2 si nécessaire

## Contraintes

- Développeur solo en alternance ingénierie de production
- Budget hébergement MVP : viser 0 € côté frontend (Vercel Hobby) et limiter le coût Render au strict nécessaire pour backend + PostgreSQL
- Phase 1 : web uniquement — application mobile React Native en phase 3

## Exigences fonctionnelles

Ces exigences décrivent le périmètre cible de la plateforme (achat et vente).

### Comptes et accès

1. Inscription obligatoire pour acheter ou vendre
2. Consultation libre du catalogue

### Catalogue et boutiques

3. Gestion des boutiques et articles
4. Photos, descriptions, prix et frais de port
5. Validation des articles avant leur publication

### Paiement

6. Paiement directement sur le site par carte bancaire
7. Interdiction du partage d'informations personnelles permettant un paiement direct entre particuliers

### Relation et réputation

8. Chat entre acheteurs et vendeurs
9. Notation des utilisateurs

### Personnalisation et notifications

10. Recommandations personnalisées
11. Notifications concernant les nouveaux articles et les changements de prix
12. Envoi possible des notifications par e-mail

### Sécurité et fraude

13. Gestion de la fraude et des anomalies
14. Possibilité d'intégrer un outil externe de détection de fraude
