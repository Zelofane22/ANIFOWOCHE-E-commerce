# Implémentation ANIF Seller

## Backend

### Modèle `Shop` — `code/backend/apps/sellers/models.py`

```python
class Shop(models.Model):
    # ... champs existants ...
    is_published = models.BooleanField(default=True)
    visible_on_main_store = models.BooleanField(
        default=True,
        help_text="Afficher les produits de cette boutique dans le catalogue, "
                  "la recherche et la wishlist de la vitrine principale anifowoche.com",
    )
```

### Admin — `code/backend/apps/sellers/admin.py`

Le champ `visible_on_main_store` est ajouté à `list_display` et `list_filter` de `ShopAdmin`.

### Filtrage du catalogue principal — `code/backend/apps/products/views.py`

```python
# ProductViewSet
Product.objects.filter(is_active=True).filter(
    Q(shop__isnull=True) | Q(shop__visible_on_main_store=True)
)
```

### Filtrage de la wishlist — `code/backend/apps/wishlist/views.py`

```python
# WishlistItemViewSet.get_queryset
WishlistItem.objects.filter(user=self.request.user).filter(
    Q(product__shop__isnull=True) | Q(product__shop__visible_on_main_store=True)
)
```

### Endpoint produit public — `code/backend/apps/sellers/views.py`

```python
class PublicShopProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductSerializer  # Même serializer, le frontend cache
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        shop = get_object_or_404(Shop, slug=self.kwargs["shop_slug"], is_published=True)
        return Product.objects.filter(
            Q(shop=shop) | Q(shop__isnull=True, seller=shop.seller),
            is_active=True,
        )
```

Route : `GET /api/public/shops/<shop_slug>/products/<slug>/`

## Frontend

### Détection du sous-domaine — `code/frontend/src/App.jsx`

```js
const hostname = window.location.hostname;
const isSellerSubdomain = hostname === "seller.anifowoche.com"
                       || hostname.startsWith("seller.");
```

Sur le sous-domaine, seules 3 routes sont actives :
| Route | Composant |
|-------|-----------|
| `/` | `SellerSubLanding` — page d'accueil du sous-domaine |
| `/:slug` | `PublicShop` — vitrine du vendeur |
| `/:slug/produits/:productSlug` | `SellerProductDetail` — détail produit |

Le `Navbar` et le `Footer` du site principal sont masqués (via `isSellerSurface`).

### ShopRedirect — `code/frontend/src/pages/ShopRedirect.jsx`

Redirige `anifowoche.com/shop/:slug` vers `seller.anifowoche.com/:slug` via
`window.location.replace()` (navigation complète, pas client-side).

### SellerProductDetail — `code/frontend/src/pages/SellerProductDetail.jsx`

Page produit minimaliste :
- Aucun bouton "Ajouter au panier"
- Aucune section avis / commentaires / wishlist
- Aucun affichage de promo / prix barré
- Aucune intégration FedaPay
- CTA unique : "Contacter le vendeur sur WhatsApp" avec message pré-rempli

Appels API :
- `getPublicShopProduct(shopSlug, productSlug)` → `/api/public/shops/<slug>/products/<slug>/`
- `getPublicShop(shopSlug)` → pour récupérer le numéro WhatsApp

### Redirection Vercel — `code/frontend/vercel.json`

```json
{
  "redirects": [
    {
      "source": "/shop/:slug",
      "destination": "https://seller.anifowoche.com/:slug",
      "permanent": true
    }
  ]
}
```

## Déploiement

### Variables d'environnement Render

| Variable | Valeur prod | sync |
|----------|-------------|------|
| `CORS_ALLOWED_ORIGINS` | `https://anifowoche.com,https://seller.anifowoche.com` | false |
| `SELLER_FRONTEND_BASE_URL` | `https://seller.anifowoche.com` | false |

### DNS

- Enregistrement CNAME : `seller.anifowoche.com → cname.vercel-dns.com`

### Domaines Vercel

- Ajouter `seller.anifowoche.com` comme domaine supplémentaire sur le projet frontend
- Même build, pas de configuration supplémentaire

## Tests

```bash
# Backend (sellers + products + wishlist)
docker compose -f code/docker-compose.yml exec backend python manage.py test apps.sellers apps.products apps.wishlist

# Frontend lint
docker compose -f code/docker-compose.yml exec frontend npx eslint src/

# Frontend build
docker compose -f code/docker-compose.yml exec frontend npm run build
```
