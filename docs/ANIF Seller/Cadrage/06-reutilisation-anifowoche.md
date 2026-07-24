# Réutilisation du projet ANIFOWOCHE

[← Retour](README.md)

## Pourquoi partir du projet existant

Le projet ANIFOWOCHE contient déjà une base e-commerce utile : catalogue, panier, commandes, auth, dashboard, paiements locaux et architecture React + Django.

ANIF Seller peut donc être développé plus vite en réutilisant cette expérience, mais le produit ne doit pas être une simple copie. ANIFOWOCHE est une boutique pour une marque précise. ANIF Seller est un SaaS pour plusieurs vendeurs.

## Ce qui peut être réutilisé

| Élément ANIFOWOCHE | Réutilisation possible |
|--------------------|------------------------|
| Backend Django REST | Base API solide pour produits, commandes, utilisateurs |
| Frontend React/Vite | Pages, composants, routage, appels API |
| Auth JWT | Connexion vendeur et sécurité |
| Modèles produits | Point de départ pour catalogue vendeur |
| Modèles commandes | Point de départ pour suivi commande |
| Paiements FedaPay/KkiaPay | Intégration future |
| Dashboard admin | Inspiration pour le tableau vendeur |
| Documentation Docker | Environnement de développement |

## Ce qui doit changer

### 1. Passer d'une boutique unique à plusieurs boutiques

ANIFOWOCHE vend les produits d'un seul commerce. ANIF Seller doit ajouter une notion de vendeur ou boutique.

Exemples de modèles possibles :

- `SellerProfile`
- `Shop`
- `Product` lié à une boutique
- `Order` lié à une boutique
- `Customer` lié à une boutique

### 2. Séparer espace vendeur et boutique publique

Deux expériences doivent exister :

- espace vendeur privé : gestion produits, commandes, clients ;
- boutique publique : page consultée par les clients.

### 3. Simplifier le parcours client

Pour ANIF Seller, le client ne doit pas forcément créer un compte. Il doit pouvoir commander rapidement avec :

- nom ;
- téléphone ;
- adresse ou note ;
- quantité ;
- option de contact WhatsApp.

### 4. Adapter le design

ANIFOWOCHE a une identité boutique mode. ANIF Seller doit avoir une interface plus SaaS :

- dashboard clair ;
- navigation simple ;
- listes et tableaux efficaces ;
- formulaires rapides ;
- mobile-first pour les vendeurs.

## Architecture cible simplifiée

```text
Client final
  ↓
Boutique publique vendeur
  ↓
Commande
  ↓
Dashboard vendeur
  ↓
Confirmation WhatsApp / paiement / livraison
```

## Entités principales

| Entité | Rôle |
|--------|------|
| User | Compte de connexion |
| SellerProfile | Informations du vendeur |
| Shop | Boutique publique liée au vendeur |
| Product | Produit vendu par une boutique |
| ProductVariant | Taille, couleur ou format optionnel |
| Customer | Client ayant commandé |
| Order | Commande passée |
| OrderItem | Produit et quantité dans une commande |
| Payment | Paiement manuel ou automatique |
| Subscription | Offre SaaS du vendeur |

## Routes frontend possibles

| Route | Usage |
|-------|-------|
| `/seller/login` | Connexion vendeur |
| `/seller/register` | Inscription vendeur |
| `/seller/dashboard` | Vue globale |
| `/seller/products` | Gestion produits |
| `/seller/orders` | Gestion commandes |
| `/seller/customers` | Historique clients |
| `/seller/settings` | Paramètres boutique |
| `/shop/:slug` | Boutique publique |
| `/shop/:slug/product/:id` | Fiche produit publique |
| `/shop/:slug/order` | Formulaire commande |

## API backend possible

| Endpoint | Usage |
|----------|-------|
| `/api/seller/profile/` | Profil vendeur |
| `/api/seller/products/` | Produits du vendeur connecté |
| `/api/seller/orders/` | Commandes du vendeur connecté |
| `/api/seller/customers/` | Clients du vendeur connecté |
| `/api/public/shops/:slug/` | Boutique publique |
| `/api/public/shops/:slug/products/` | Produits publics |
| `/api/public/shops/:slug/orders/` | Création commande publique |
| `/api/subscriptions/` | Offres et abonnement |

## Décision recommandée

Ne pas mélanger directement ANIF Seller dans ANIFOWOCHE tant que le concept n'est pas validé.

Approche prudente :

1. documenter le concept ;
2. créer une branche ou un module expérimental ;
3. extraire les parties réutilisables ;
4. développer un MVP vendeur simple ;
5. tester avec quelques vendeurs pilotes ;
6. décider ensuite si ANIF Seller devient un nouveau projet séparé ou une évolution majeure d'ANIFOWOCHE.

