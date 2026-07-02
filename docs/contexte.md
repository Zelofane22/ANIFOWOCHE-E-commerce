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
- Capacité : 7 heures/semaine (principalement le weekend)
- Budget hébergement MVP : viser 0 € côté frontend (Vercel Hobby) et limiter le coût Render au strict nécessaire pour backend + PostgreSQL
- Phase 1 : web uniquement — application mobile React Native en phase 3
