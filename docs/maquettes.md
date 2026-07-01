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

## Prochaine itération

- Espace client (`pages/Account`) — historique commandes (US-17), adresses sauvegardées (US-18) : à maquetter au Sprint 4, pas prioritaire avant.
- Une fois ces wireframes validés, passer en visuel (Canva ou Excalidraw) pour fixer les couleurs/typo avant intégration Tailwind — non bloquant pour démarrer le découpage en composants React.
