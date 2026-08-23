# Refonte UX/UI mobile — ANIF Seller

Conçois une interface mobile-first moderne pour **ANIF Seller**, le SaaS permettant aux vendeurs de créer et gérer leur boutique en ligne.

## Objectif UX

L'expérience doit s'inspirer des meilleures applications **fintech / néobanques modernes** comme Revolut, N26 et Monzo, sans les copier.

Le principe central :

> **Le vendeur doit comprendre sa situation en quelques secondes et savoir immédiatement quelle action effectuer.**

L'interface doit privilégier :

* clarté ;
* confiance ;
* rapidité ;
* hiérarchie visuelle forte ;
* actions accessibles au pouce ;
* informations financières facilement lisibles ;
* réduction de la charge cognitive.

Le design doit être adapté à des vendeurs qui utilisent principalement leur smartphone.

---

## Direction artistique

Créer un design **Fintech × Commerce africain**, premium mais accessible.

### Style

* mobile-first ;
* interface très propre et aérée ;
* cartes avec coins légèrement arrondis ;
* ombres très discrètes ;
* typographie moderne et très lisible ;
* grands chiffres pour les indicateurs financiers ;
* icônes simples et cohérentes ;
* contrastes accessibles ;
* animations et micro-interactions discrètes ;
* éviter les interfaces surchargées ;
* éviter l'apparence d'un back-office desktop compressé sur mobile.

Ne pas copier visuellement Revolut, N26 ou Monzo : utiliser uniquement leurs **patterns UX** comme inspiration.

---

# Écrans à créer

Créer les 7 écrans principaux suivants en **390 × 844 px**.

## 1. Dashboard vendeur

Le dashboard doit être le centre de pilotage de la boutique.

Structure :

### Header

* salutation ;
* nom de la boutique ;
* notification ;
* menu secondaire.

### Carte principale

Afficher :

**CA ce mois**

`245 000 FCFA`

`↑ +18,4 % vs mois dernier`

Ajouter un petit graphique d'évolution simple.

Permettre de changer la période :

`7 jours · 30 jours · 3 mois`

### Actions rapides

Afficher maximum 4 actions :

* `+ Ajouter produit`
* `Commandes`
* `Partager`
* `Statistiques`

Présenter ces actions sous forme de boutons/icônes facilement accessibles.

### À traiter

Créer une carte d'alerte :

**3 commandes nécessitent votre attention**

* 2 à confirmer
* 1 paiement en attente

CTA :

**Voir les commandes →**

### Activité récente

Présenter les dernières commandes comme une activité bancaire :

* numéro de commande ;
* client ;
* heure/date ;
* montant ;
* statut.

Exemple :

`#1042 — Jean — +35 000 FCFA`

### Navigation

Bottom navigation persistante :

* Accueil
* Produits
* Commandes
* Boutique
* Plus

---

# 2. Liste des commandes

Créer une expérience proche d'un historique de transactions bancaire.

Header :

**Commandes**

Filtres horizontaux :

`Toutes · À traiter · Terminées`

Chaque commande doit être une carte ou une ligne très lisible contenant :

* numéro ;
* client ;
* date/heure ;
* nombre de produits ;
* montant ;
* statut.

Utiliser des statuts visuels clairement différenciés :

* À confirmer
* Paiement en attente
* Confirmée
* Préparation
* Livrée
* Annulée

Prévoir une recherche.

---

# 3. Détail d'une commande

Créer une page très orientée action.

Header :

**Commande #1042**

Afficher immédiatement :

**35 000 FCFA**

`Paiement : En attente`

### Timeline

Créer une timeline verticale :

Commande reçue
↓
Paiement confirmé
↓
Préparation
↓
Livrée

### Client

Afficher :

* nom ;
* téléphone ;
* boutons `Appeler` et `WhatsApp`.

### Produits

Afficher chaque produit avec :

* image ;
* nom ;
* quantité ;
* prix.

### Action principale

Afficher un CTA fixe ou très visible :

**Confirmer la commande**

---

# 4. Liste des produits

Créer un catalogue visuel mobile.

Header :

**Produits**

CTA :

`+ Ajouter`

Recherche :

`Rechercher un produit...`

Filtres :

`Tous · Actifs · Rupture`

Utiliser une grille **2 colonnes**.

Chaque produit doit afficher :

* grande image ;
* nom ;
* prix ;
* disponibilité ;
* éventuellement nombre de ventes ;
* menu secondaire.

Exemple :

**Chemise Bazin Premium**
`18 000 FCFA`
`● Disponible`

---

# 5. Détail produit

Créer une fiche produit vendeur.

Afficher :

* galerie d'images ;
* nom ;
* prix ;
* stock ;
* statut ;
* description ;
* options/variantes si disponibles ;
* statistiques simples du produit.

Actions :

**Modifier**

**Désactiver**

Le bouton principal doit rester facilement accessible.

---

# 6. Ajouter un produit

Créer une expérience de création progressive plutôt qu'un long formulaire.

Afficher une progression :

`① Photo → ② Informations → ③ Prix & stock → ④ Publication`

Priorité :

1. photo ;
2. nom ;
3. prix ;
4. stock ;
5. publication.

Les champs secondaires doivent être relégués plus bas ou dans des sections secondaires.

Objectif UX :

> Permettre de publier un produit rapidement depuis un smartphone.

CTA principal :

**Publier le produit**

---

# 7. Boutique / Partage

Cette page doit mettre en avant la valeur commerciale de la boutique.

Afficher :

**Votre boutique est prête**

URL de la boutique :

`anifowoche.com/shop/nom-boutique`

Actions principales :

* `Copier le lien`
* `Partager`
* `WhatsApp`

Afficher également un aperçu visuel de la boutique.

---

# Système de navigation

Utiliser une **bottom navigation mobile persistante** :

1. Accueil
2. Produits
3. Commandes
4. Boutique
5. Plus

L'onglet actif doit être clairement identifiable.

Éviter les menus hamburger pour les fonctionnalités principales.

---

# Abonnement et limites

ANIF Seller possède plusieurs offres.

Les limites doivent être présentées comme des **indicateurs de progression**, jamais comme des messages agressifs.

Exemple :

**Votre offre — Gratuit**

Produits
`████████░░ 4 / 5`

Commandes
`████████░░ 4 / 5`

CTA secondaire :

**Voir les offres →**

Ne pas afficher constamment des promotions ou popups d'upgrade.

---

# Design system

Créer également les composants réutilisables nécessaires :

* Button ;
* IconButton ;
* BottomNavigation ;
* Card ;
* StatCard ;
* ProductCard ;
* OrderItem ;
* StatusBadge ;
* QuickAction ;
* SearchBar ;
* FilterChip ;
* Input ;
* QuantityStepper ;
* Timeline ;
* BottomSheet ;
* Toast ;
* EmptyState ;
* LoadingState ;
* ErrorState.

Créer des variantes pour les différents états.

---

# Responsive

Le design est **mobile-first**, mais les composants doivent être conçus de manière à pouvoir être adaptés ensuite aux écrans tablette et desktop.

Priorité absolue :

**390 × 844 px**

Prévoir des touch targets suffisamment grandes et une navigation utilisable au pouce.

---

# Principes UX à respecter

1. Une information importante doit être identifiable en moins de 2 secondes.
2. Une action fréquente doit être réalisable en 1 à 2 taps.
3. Les montants doivent avoir une hiérarchie visuelle forte.
4. Les statuts doivent être compréhensibles sans dépendre uniquement de la couleur.
5. Les erreurs doivent être explicites et récupérables.
6. Les écrans vides doivent expliquer quoi faire ensuite.
7. Les confirmations doivent être claires pour éviter les erreurs commerciales.
8. Ne pas transformer le dashboard en tableau de données.
9. Favoriser les tâches et décisions plutôt que les métriques seules.
10. L'expérience doit donner une impression de produit SaaS professionnel et fiable.

## Résultat attendu

Créer dans Figma une **expérience mobile complète et cohérente d'ANIF Seller**, avec :

* les 7 écrans ;
* leurs états principaux ;
* les composants réutilisables ;
* une navigation cohérente ;
* un design system minimal ;
* une hiérarchie visuelle inspirée des fintech modernes ;
* une identité visuelle propre à ANIFOWOCHE.

Le résultat doit être suffisamment détaillé pour servir ensuite de référence directe à l'implémentation frontend React.
