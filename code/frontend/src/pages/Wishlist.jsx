import { useEffect, useState } from "react";
import { Link } from "react-router";
import { fetchWishlist, removeFromWishlist } from "../api/wishlist.js";
import { AccountBreadcrumb, RequireAccount } from "../components/account/common.jsx";
import { HeartIcon, TrashIcon } from "../components/icons.jsx";
import { extractErrorMessage } from "../utils/apiError.js";
import { formatXof } from "../utils/format.js";

function WishlistContent() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWishlist()
      .then((data) => setItems(data.results ?? data))
      .catch((err) => {
        setError(extractErrorMessage(err));
        setItems([]);
      });
  }, []);

  const handleRemove = async (productId) => {
    try {
      await removeFromWishlist(productId);
      setItems((current) => current.filter((item) => item.product.id !== productId));
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <AccountBreadcrumb />

      <h1 className="mb-1 text-2xl font-bold text-ink">Vos favoris</h1>
      <p className="mb-6 text-sm text-muted">
        Les articles que vous avez mis de côté pour plus tard.
      </p>

      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {items === null && (
        <div className="h-40 animate-pulse rounded-xl border border-black/10 bg-brand-pale" />
      )}

      {items !== null && items.length === 0 && !error && (
        <div className="rounded-xl border border-black/10 bg-white px-4 py-16 text-center text-muted">
          <HeartIcon size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-ink">Aucun favori pour le moment</p>
          <p className="mt-1 text-sm">
            Touchez le cœur sur une fiche produit pour l'ajouter ici.
          </p>
          <Link
            to="/catalogue"
            className="mt-5 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-medium"
          >
            Découvrir la collection
          </Link>
        </div>
      )}

      {items !== null && items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-xl border border-black/10 bg-white p-4 transition hover:shadow-md"
            >
              <Link
                to={`/produits/${item.product.slug}`}
                className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-brand-pale"
              >
                {item.product.image && (
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link
                  to={`/produits/${item.product.slug}`}
                  className="line-clamp-2 text-sm font-semibold text-ink hover:text-brand-dark"
                >
                  {item.product.name}
                </Link>
                <p className="mt-1 text-sm font-bold text-ink">
                  {formatXof(item.product.price_xof)}
                </p>
                <button
                  type="button"
                  onClick={() => handleRemove(item.product.id)}
                  className="mt-auto inline-flex items-center gap-1.5 self-start text-sm font-medium text-red-600 transition hover:underline"
                >
                  <TrashIcon size={13} /> Retirer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Wishlist() {
  return (
    <RequireAccount>
      <WishlistContent />
    </RequireAccount>
  );
}
