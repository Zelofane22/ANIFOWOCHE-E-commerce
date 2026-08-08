# Architecture ANIF Seller SAAS

## Vue d'ensemble

ANIF Seller est un SAAS de vitrine privée pour vendeurs, séparé de la boutique publique ANIFOWOCHE.
Les vendeurs disposent d'un espace dashboard sur le domaine principal et d'une vitrine publique
accessible via un sous-domaine dédié.

```
┌─────────────────────────────────────────────┐
│  anifowoche.com                              │
│  ─────────────                               │
│  /              — Accueil, catalogue public   │
│  /produits/:slug — Page produit (complète)   │
│  /shop/:slug    — Redirection 301 vers       │
│                   seller.anifowoche.com       │
│  /seller/*      — Dashboard vendeur (auth)   │
└─────────────────────────────────────────────┘
                      ┃ 301 redirect
                      ▼
┌─────────────────────────────────────────────┐
│  seller.anifowoche.com                       │
│  ────────────────────                        │
│  /                            — Page d'accueil du sous-domaine │
│  /:slug                       — Vitrine publique du vendeur    │
│  /:slug/produits/:productSlug — Page produit simplifiée        │
│                                 (pas de wishlist, avis, promo, │
│                                  FedaPay — CTA WhatsApp only)  │
└─────────────────────────────────────────────┘
                      ┃
                      ▼
┌─────────────────────────────────────────────┐
│  API Backend (anifowoche-backend)            │
│  ────────────────                             │
│  /api/products/               ← filtré par   │
│  /api/wishlist/                 visible_on_   │
│  /api/public/shops/:slug/    main_store      │
│  /api/public/shops/:slug/                    │
│       /products/:slug/        ← nouveau      │
└─────────────────────────────────────────────┘
```

## Règles métier

- **visible_on_main_store** : booléen sur `Shop`. Quand `False`, les produits de la boutique
  sont exclus du catalogue principal, de la recherche et de la wishlist sur `anifowoche.com`.
- **is_published** : booléen sur `Shop`. Quand `False`, la boutique est introuvable
  même sur `seller.anifowoche.com` (404).
- Les deux champs sont indépendants : une boutique peut être publiée sur son sous-domaine
  mais invisible du catalogue principal, ou vice-versa.
- Les produits sans `shop` (créés par l'admin) ne sont jamais filtrés.

## Flux utilisateur

1. Le vendeur s'inscrit sur `anifowoche.com/seller/register`
2. Il gère ses produits/commandes depuis son dashboard (`/seller/*`)
3. Sa vitrine publique est accessible sur `seller.anifowoche.com/<slug>`
4. Les visiteurs parcourent les produits et contactent le vendeur via WhatsApp
5. Pas de paiement en ligne, pas de panier, pas de wishlist sur la vitrine vendeur
