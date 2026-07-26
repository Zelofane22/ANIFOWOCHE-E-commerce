# 🎨 Maquettes — Wireframes MVP

[← Retour au README](../README.md)

Wireframes texte des écrans prioritaires du Sprint 1–2 (catalogue, panier, commande), avant développement React. Mobile-first : la majorité des visiteurs visés (Cotonou, paiement mobile money) navigueront depuis un smartphone — chaque écran est pensé d'abord en colonne unique, puis adapté en desktop.

Composants référencés : `Navbar`, `ProductCard`, `Cart` (voir [structure frontend](../README.md#-structure-du-projet-mono-repo)).


## Mockup global frontend
Toujours utiliser ou s'inpirer de la maque figma pour les interfaces frontend.
/home/zelofane/projets/ANIFOWOCHE-E-commerce/docs/ANIFIWOSHE Mockup Figma

---

## 1. Accueil / Catalogue — `pages/Home`, `pages/Catalogue`

Couvre US-01 (parcourir par catégorie), US-04 (recherche).

```
┌─────────────────────────────────┐
│ ☰  ANIFOWOCHE         🔍  🛒(2) │  <- Navbar
├─────────────────────────────────┤
│ [ Recherche produit...       ]  │  <- US-04
├─────────────────────────────────┤
│ Catégories :                    │
│ ( Tissus ) ( Vêtements ) ( Acc.)│  <- filtres US-01
├─────────────────────────────────┤
│ ┌───────────┐  ┌───────────┐    │
│ │  Photo    │  │  Photo    │    │
│ │ Bazin XOF │  │ Chemise   │    │  <- ProductCard x N
│ │ 15 000 F  │  │ 12 000 F  │    │     (grille responsive :
│ └───────────┘  └───────────┘    │      1 col mobile, 3-4 col desktop)
│ ┌───────────┐  ┌───────────┐    │
│ │  Photo    │  │  Photo    │    │
│ └───────────┘  └───────────┘    │
├─────────────────────────────────┤
│ Footer : contact WhatsApp       │
└─────────────────────────────────┘
```

Notes :
- `ProductCard` : photo carrée, nom, prix en XOF, badge catégorie. Clic → fiche produit.
- Filtres catégorie = boutons toggle, pas de menu déroulant (plus rapide au tap mobile).
- Recherche (US-04) : champ texte simple, filtre côté client en MVP (pas de debounce serveur nécessaire au volume initial).

---

## 2. Fiche produit — `pages/Product`

Couvre US-02 (photo, description, prix, tailles).

```
┌─────────────────────────────────┐
│ ←  ANIFOWOCHE              🛒   │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │      Photo produit          │ │  <- image principale,
│ │                             │ │     swipe si plusieurs photos
│ └─────────────────────────────┘ │
│ ● ○ ○                            │  <- pagination photos
├─────────────────────────────────┤
│ Chemise homme casual             │
│ 12 000 XOF                       │
│                                   │
│ Taille :  [S] [M] [L] [XL]       │  <- sélection obligatoire avant ajout
│                                   │
│ Description :                    │
│ Lorem ipsum tissu coton...       │
│                                   │
│ [   Ajouter au panier   ]        │  <- US-05, désactivé si pas de taille
└─────────────────────────────────┘
```

Notes :
- Si le produit est un tissu vendu au mètre (pas de taille S/M/L), le bloc "Taille" est remplacé par un sélecteur de quantité (mètres) — à confirmer avec le père sur les produits réels.
- Bouton "Ajouter au panier" toujours visible (sticky bottom sur mobile).

---

## 3. Panier — `pages/Cart` (composant `Cart`)

Couvre US-05 (ajout, modification quantité).

```
┌─────────────────────────────────┐
│ ←  Mon panier                   │
├─────────────────────────────────┤
│ ┌───┐ Chemise casual            │
│ │img│ Taille M                  │
│ └───┘ 12 000 XOF   [- 1 +]  🗑  │
├─────────────────────────────────┤
│ ┌───┐ Bazin 3m                  │
│ │img│ 15 000 XOF   [- 1 +]  🗑  │
└───┘                              │
├─────────────────────────────────┤
│ Sous-total :        27 000 XOF   │
│                                   │
│ [   Valider la commande   ]      │  <- vers US-06
└─────────────────────────────────┘
```

Notes :
- Panier vide → message + bouton retour catalogue (pas d'écran bloquant).
- Quantité modifiable inline (`-`/`+`), suppression directe (icône corbeille), sans page de confirmation supplémentaire.

---

## 4. Commande / Checkout — `pages/Checkout`

Couvre US-06 (adresse Cotonou), US-09/US-10 (paiement), US-13 (créneau livraison).

```
┌─────────────────────────────────┐
│ ←  Récapitulatif de commande    │
├─────────────────────────────────┤
│ Récap articles (lecture seule)  │
│ Total : 27 000 XOF               │
├─────────────────────────────────┤
│ Adresse de livraison              │
│ Quartier (Cotonou) : [________]  │  <- US-13
│ Indications :        [________]  │
│ Créneau :    ( Matin ) ( Soir )  │
├─────────────────────────────────┤
│ Téléphone :          [________]  │  <- pour SMS/WhatsApp US-07/US-15
├─────────────────────────────────┤
│ Moyen de paiement :               │
│ ( MTN Money ) ( Moov Money )     │  <- US-09
│ ( Carte Visa/Mastercard )        │  <- US-10
├─────────────────────────────────┤
│ [      Payer 27 000 XOF      ]   │
└─────────────────────────────────┘
```

Notes :
- Le choix du moyen de paiement détermine le flux FedaPay/KkiaPay déclenché côté backend (`/payments/`).
- Pas de création de compte obligatoire à cette étape (checkout invité possible) — la création de compte (US-16) reste optionnelle pour ne pas freiner la première commande.
- Après paiement : écran de confirmation avec numéro de commande + rappel qu'un récap est envoyé par SMS/email (US-07).

---

## 5. Espace client — `pages/Account`, `Orders`, `OrderDetail`, `Addresses`, `Wishlist`

Implémenté (juillet 2026) d'après les écrans `account`, `orders`, `order-detail` et le flow de
retour de la [maquette Figma](ANIFIWOSHE%20Mockup%20Figma/src/app/App.tsx) — pas de wireframe
texte, la maquette fait référence. Couvre US-17 (historique commandes) et US-18 (adresses).

| Route | Écran |
|-------|-------|
| `/compte` | Hub : accueil personnalisé, stats rapides (commandes/favoris/adresses), cartes de gestion, aperçu des 2 dernières commandes. Formulaires connexion/inscription si déconnecté. |
| `/compte/commandes` | Liste des commandes : recherche (n° ou produit), filtre par période, cartes avec vignettes produits, badge de statut, actions Détails / Retour. |
| `/compte/commandes/:id` | Détail : résumé, timeline de suivi (Reçue → En préparation → Livrée, bannière si annulée), articles, adresse, paiement, demande de retour guidée (motif + commentaire). |
| `/compte/adresses` | Carnet d'adresses : cartes avec badge « Par défaut », ajout/suppression. |
| `/compte/favoris` | Liste de souhaits : vignettes, lien fiche produit, retrait. |

Les sous-pages sont protégées : un visiteur non connecté est renvoyé vers le formulaire de
connexion de `/compte`, puis ramené à la page demandée après authentification.

Écart assumé vs maquette : le retour se fait au niveau commande (motif + commentaire) et non
par article avec choix du mode de retour — le backend (`apps/returns`) ne modélise pas encore
les retours par item. Le bouton « Télécharger la facture » de la maquette est omis (pas
d'endpoint facture).

---

## Prochaine itération
- Retour par article + choix du mode de retour (point relais, enlèvement, dépôt) comme dans la maquette Figma — nécessite d'étendre `ReturnRequest` côté backend.
