# 🎨 Prompt Figma Make — Maquette responsive

[← Retour au README](../README.md)

Prompt prêt à coller dans [Figma Make](https://www.figma.com/make/) pour générer une maquette haute-fidélité, mobile-first, du site ANIFOWOCHE. Basé sur les wireframes de [maquettes.md](maquettes.md) (catalogue, fiche produit, panier, checkout).

Thème imposé : fond blanc, accent jaune `#E6D315` décliné en nuances.

---

```
Crée une maquette UI complète et responsive (mobile-first) pour ANIFOWOCHE,
un site e-commerce de vente de tissus, vêtements et accessoires basé à Cotonou,
Bénin. La cible principale navigue depuis un smartphone avec une connexion
parfois lente, et paie majoritairement via mobile money (MTN Money, Moov Money).

## Identité visuelle
- Fond principal : blanc pur (#FFFFFF), très aéré, beaucoup d'espace blanc.
- Couleur d'accent unique : jaune #E6D315, décliné en nuances :
  - Jaune principal (CTA, boutons actifs, prix) : #E6D315
  - Jaune foncé (hover/pressed, texte sur fond jaune clair) : #B8A60F
  - Jaune moyen (icônes secondaires, bordures actives) : #D4C312
  - Jaune clair (fonds de badges, sections alternées, hover léger) : #FAF6C9
  - Jaune très pâle (fonds de cartes, séparateurs, skeleton loading) : #FDFBE8
- Texte : noir quasi pur #1A1A1A pour les titres et prix (jamais de texte jaune
  sur blanc, contraste insuffisant), gris neutre #6B6B6B pour le texte secondaire.
- Pas d'autre couleur saturée. Utiliser uniquement du noir/gris pour les icônes
  utilitaires (panier, recherche, corbeille) ; le jaune reste réservé aux actions
  principales et aux accents de marque.
- Typographie : sans-serif moderne et lisible (type Inter, Poppins ou Manrope),
  titres en semi-bold/bold, corps de texte en regular, tailles confortables au
  tap mobile (min 16px pour le corps).
- Style général : épuré, beaucoup de respiration, coins arrondis moyens (8-12px),
  ombres très légères (pas de skeuomorphisme), look "artisanal mais moderne"
  qui valorise les photos de tissus/vêtements.

## Structure & navigation
- Header sticky : logo "ANIFOWOCHE" à gauche, icône recherche + icône panier
  (avec badge compteur jaune) à droite. Menu burger sur mobile, navigation
  horizontale par catégories sur desktop.
- Footer simple : lien WhatsApp de contact, mentions légales, liens réseaux sociaux.
- Breakpoints : mobile (base, colonne unique, <640px), tablette (640-1024px,
  grille 2-3 colonnes), desktop (>1024px, grille 3-4 colonnes, header élargi
  avec navigation complète visible).

## Écrans à concevoir (en version mobile ET desktop, avec liens entre les écrans)

### 1. Accueil / Catalogue
- Barre de recherche produit en haut.
- Filtres catégories sous forme de boutons toggle horizontaux scrollables
  (Tissus, Vêtements, Accessoires) — pas de menu déroulant.
- Grille de ProductCard : photo carrée, nom du produit, prix en FCFA (format
  "15 000 F"), badge catégorie. 1 colonne mobile, 3-4 colonnes desktop.
- Bannière promo optionnelle en haut de page (fond jaune clair).

### 2. Fiche produit
- Carrousel photo principal (swipe mobile) avec pagination en points.
- Nom produit, prix en gros (jaune foncé ou noir avec accent jaune), description.
- Sélecteur de taille (S/M/L/XL) en boutons toggle, OU sélecteur de quantité
  en mètres pour les tissus vendus au mètre.
- Bouton "Ajouter au panier" sticky en bas d'écran sur mobile, désactivé tant
  qu'une taille n'est pas choisie (état visuellement distinct : gris vs jaune actif).

### 3. Panier
- Liste des articles : vignette photo, nom, taille/quantité, prix unitaire,
  stepper quantité (- / +), icône suppression.
- Sous-total bien visible, bouton "Valider la commande" en jaune plein,
  pleine largeur, sticky en bas sur mobile.
- État panier vide : illustration légère + message + bouton retour catalogue.

### 4. Commande / Checkout
- Récapitulatif articles en lecture seule + total.
- Formulaire adresse : quartier (Cotonou), indications complémentaires,
  sélecteur de créneau de livraison (Matin / Soir) en boutons toggle.
- Champ téléphone (pour confirmation SMS/WhatsApp).
- Sélection moyen de paiement : cartes/boutons distincts pour MTN Mobile Money,
  Moov Money, Carte Visa/Mastercard (utiliser les codes couleur officiels de
  ces opérateurs uniquement sur leur logo/icône, le reste de l'UI reste blanc/jaune).
- Bouton final "Payer [montant] XOF" en jaune plein, bien visible.

### 5. Confirmation de commande
- Écran de succès : icône de validation, numéro de commande, rappel qu'un
  récapitulatif est envoyé par SMS/email, bouton retour à l'accueil.

## Détails d'interaction & responsive
- Tous les boutons d'action principale (CTA) : fond jaune #E6D315, texte noir
  #1A1A1A (meilleur contraste que blanc sur jaune), coins arrondis, état hover/
  pressed en #B8A60F.
- Boutons secondaires : contour noir ou gris fin, fond blanc.
- États désactivés : fond gris clair, texte gris, sans jaune.
- Inputs : fond blanc, bordure grise fine, bordure jaune au focus.
- Composants réutilisables à garder cohérents sur tous les écrans : Navbar,
  ProductCard, bouton CTA, stepper quantité, badge catégorie.

Livre une maquette haute-fidélité, navigable, avec les variantes mobile et
desktop pour chacun des 5 écrans listés ci-dessus.
```

---

## Notes

- Le texte est volontairement en noir (`#1A1A1A`) plutôt qu'en jaune sur fond blanc : `#E6D315` seul sur blanc offre un contraste insuffisant pour l'accessibilité.
- L'écran "Confirmation de commande" est ajouté en plus des 4 wireframes existants pour couvrir tout le parcours d'achat (mentionné en note dans [maquettes.md:134](maquettes.md#L134) mais pas wireframé).
- L'espace client (`pages/Account`) n'est pas inclus, conformément à la section "Prochaine itération" de [maquettes.md](maquettes.md#prochaine-itération).
