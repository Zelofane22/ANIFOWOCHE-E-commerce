# MVP — première version vendable

[← Retour](README.md)

## Objectif du MVP

Construire une version suffisamment simple pour être utilisée par 5 à 10 vendeurs pilotes, sans attendre une plateforme complète.

Le MVP doit répondre à une question : est-ce que des vendeurs acceptent d'utiliser l'outil chaque semaine pour gérer leurs commandes ?

## Périmètre MVP

### 1. Compte vendeur

- Inscription et connexion
- Profil vendeur : nom de boutique, téléphone WhatsApp, ville, logo facultatif
- Lien public de boutique

### 2. Catalogue produits

- Création, modification et suppression de produits
- Photo principale
- Nom, description, prix, catégorie
- Stock simple : disponible, faible stock, épuisé
- Option visibilité : publié ou brouillon

### 3. Boutique publique

- Page publique listant les produits du vendeur
- Fiche produit simple
- Bouton commander
- Bouton contacter sur WhatsApp

### 4. Commandes

- Formulaire client : nom, téléphone, produit, quantité, adresse ou note
- Tableau de bord vendeur avec commandes
- Statuts : nouvelle, confirmée, payée, préparée, livrée, annulée
- Détail d'une commande

### 5. WhatsApp assisté

- Génération d'un message de confirmation
- Génération d'un message de relance paiement
- Génération d'un message de disponibilité ou rupture
- Ouverture du message dans WhatsApp via lien `wa.me`

### 6. Tableau de bord simple

- Nombre de commandes du jour
- Commandes en attente
- Chiffre d'affaires estimé
- Produits les plus commandés

## Hors périmètre MVP

- Paiement automatique obligatoire
- API WhatsApp Business officielle
- Application mobile native
- Marketplace publique multi-vendeurs
- Gestion avancée des livreurs
- Facturation comptable avancée
- Gestion multi-boutiques

## Parcours utilisateur principal

1. Le vendeur crée son compte.
2. Il ajoute 5 à 20 produits.
3. Il partage son lien boutique sur WhatsApp ou Instagram.
4. Un client consulte la boutique et passe commande.
5. Le vendeur voit la commande dans son dashboard.
6. Il confirme la commande via un message WhatsApp généré.
7. Il marque la commande comme payée, préparée puis livrée.

## Critères de succès MVP

- 5 vendeurs pilotes créent chacun au moins 10 produits.
- Chaque vendeur reçoit au moins 5 commandes ou simulations de commandes.
- Les vendeurs comprennent l'outil sans formation longue.
- Au moins 2 vendeurs déclarent qu'ils paieraient pour continuer.
- Les commandes sont plus faciles à suivre que dans WhatsApp seul.

## Priorité de développement

| Priorité | Fonctionnalité |
|----------|----------------|
| P1 | Auth vendeur |
| P1 | CRUD produits |
| P1 | Boutique publique |
| P1 | Création de commande |
| P1 | Dashboard commandes |
| P1 | Statuts de commande |
| P2 | Messages WhatsApp générés |
| P2 | Statistiques simples |
| P3 | Paiement FedaPay/KkiaPay |
| P3 | Export CSV |

