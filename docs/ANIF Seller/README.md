# ANIF Seller — Documentation

ANIF Seller est un SAAS de vitrine privée pour vendeurs, hébergé sous le
sous-domaine `seller.anifowoche.com`. Chaque vendeur dispose :

- D'un **dashboard** sur `anifowoche.com/seller/*` pour gérer produits,
  commandes et paramètres
- D'une **vitrine publique** sur `seller.anifowoche.com/<slug>` avec une
  page produit basique (pas de wishlist, avis, promo, FedaPay)
- D'un **CTA WhatsApp** comme unique moyen de contact client

## Structure des docs

| Fichier | Description |
|---------|-------------|
| [architecture.md](architecture.md) | Diagramme, règles métier, flux |
| [implementation.md](implementation.md) | Détail technique par fichier |
| [admin-guide.md](admin-guide.md) | Gestion des boutiques dans l'admin Django |

## Fichiers modifiés

```
code/backend/apps/sellers/models.py         — visible_on_main_store field
code/backend/apps/sellers/migrations/       — 0003_add_visible_on_main_store_to_shop
code/backend/apps/sellers/admin.py          — Admin list/filter
code/backend/apps/products/views.py         — ProductViewSet filter
code/backend/apps/wishlist/views.py         — WishlistItemViewSet filter
code/backend/apps/sellers/views.py          — PublicShopProductDetailView
code/backend/apps/sellers/urls.py           — New product detail route
code/frontend/src/App.jsx                   — Subdomain routing
code/frontend/src/api/seller.js             — getPublicShopProduct()
code/frontend/src/pages/ShopRedirect.jsx    — 301 redirect
code/frontend/src/pages/PublicShop.jsx      — Product links update
code/frontend/src/pages/SellerProductDetail.jsx — Minimal product page
code/frontend/vercel.json                   — 301 redirect rule
render.yaml                                 — SELLER_FRONTEND_BASE_URL env var
```
