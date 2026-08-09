# Guide administrateur — ANIF Seller

## Accès admin

`https://anifowoche.com/admin/sellers/shop/`

## Gestion des boutiques vendeurs

Deux champs booléens contrôlent la visibilité d'une boutique :

### `is_published`

- **True** (défaut) : la boutique est accessible sur `seller.anifowoche.com/<slug>`
- **False** : la boutique renvoie 404, le vendeur peut toujours utiliser son dashboard

### `visible_on_main_store`

- **True** (défaut) : les produits de la boutique apparaissent dans le catalogue,
  la recherche et la wishlist sur `anifowoche.com`
- **False** : les produits sont masqués du catalogue principal. La boutique reste
  accessible sur son sous-domaine si `is_published=True`.

### Combinaisons possibles

| is_published | visible_on_main_store | Résultat |
|:---:|:---:|---|
| ✅ | ✅ | Boutique visible partout (comportement par défaut) |
| ✅ | ❌ | Boutique visible seulement sur son sous-domaine, masquée du catalogue principal |
| ❌ | ✅ | Boutique masquée (404), mais ses produits apparaissent dans le catalogue si `shop` FK est renseignée |
| ❌ | ❌ | Boutique complètement masquée |

### Colonnes dans l'admin

- `list_display` : name, slug, whatsapp_phone, city, **is_published**, **visible_on_main_store**, created_at
- `list_filter` : is_published, **visible_on_main_store**, city
