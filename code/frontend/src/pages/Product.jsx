import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { fetchProductBySlug } from "../api/products.js";
import QuantityStepper from "../components/QuantityStepper.jsx";
import { useCart } from "../context/useCart.js";
import { formatXof } from "../utils/format.js";

export default function Product() {
  const { slug } = useParams();
  return <ProductView key={slug} slug={slug} />;
}

function ProductView({ slug }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [wishlist, setWishlist] = useState(false);

  useEffect(() => {
    fetchProductBySlug(slug)
      .then(setProduct)
      .catch((err) => setError(err.message));
  }, [slug]);

  if (error) return <p className="px-4 py-16 text-center text-red-600">Erreur : {error}</p>;
  if (!product) return <p className="px-4 py-16 text-center text-muted">Chargement…</p>;

  const handleAddToCart = () => {
    if (product.stock <= 0) return;
    addItem(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  };

  const isFabric = product.unit === "metre";
  const unit = isFabric ? "mètre" : null;
  const badge = isFabric ? "Meilleure vente" : product.category?.name;
  const hasGallery = false;

  const stock = product.stock ?? 0;
  const outOfStock = stock <= 0;
  const lowStock = !outOfStock && stock <= 5;
  const stockLabel = outOfStock ? "Rupture de stock" : lowStock ? `Plus que ${stock} en stock` : "En stock";
  const stockColorClass = outOfStock ? "text-red-700" : lowStock ? "text-amber-700" : "text-green-700";

  return (
    <article className="mx-auto max-w-7xl px-4 py-6 pb-28 lg:pb-10">
      <div className="mb-5 flex items-center gap-2 text-xs text-muted">
        <button type="button" onClick={() => navigate("/catalogue")} className="transition hover:text-brand-dark">
          Catalogue
        </button>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
        </svg>
        {product.category?.name && (
          <>
            <span>{product.category.name}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
            </svg>
          </>
        )}
        <span className="max-w-52 truncate text-ink">{product.name}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr_340px] lg:gap-8">
        <div className="flex gap-3">
          <div className="hidden flex-col gap-2 sm:flex">
            <button
              type="button"
              className="h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 border-brand bg-brand-pale"
              aria-label="Image produit sélectionnée"
            >
              {product.image ? (
                <img src={product.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-brand-dark">
                  ANI
                </span>
              )}
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-brand-pale">
              {product.image ? (
                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-bold text-brand-dark">
                  ANIFOWOCHE
                </div>
              )}
              {hasGallery && (
                <>
                  <button
                    type="button"
                    className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow transition hover:bg-white"
                    aria-label="Image précédente"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow transition hover:bg-white"
                    aria-label="Image suivante"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            {hasGallery && (
              <div className="mt-2 flex justify-center gap-1.5 sm:hidden">
                <span className="h-2 w-4 rounded-full bg-brand" />
                <span className="h-2 w-2 rounded-full bg-black/20" />
                <span className="h-2 w-2 rounded-full bg-black/20" />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          {badge && (
            <span className="mb-2 w-fit rounded-full border border-brand/30 bg-brand-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-dark">
              {badge}
            </span>
          )}
          <h1 className="text-xl font-bold leading-snug text-ink md:text-3xl lg:text-2xl">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-b border-black/10 pb-4">
            <span className="text-sm tracking-[1px] text-brand" aria-hidden="true">
              ★★★★★
            </span>
            <span className="text-sm font-semibold text-brand-dark">4.7</span>
            <span className="text-sm text-muted">128 avis</span>
          </div>

          <div className="mt-5">
            <div className="flex items-baseline gap-3">
              <p className="text-3xl font-bold text-ink">{formatXof(product.price_xof)}</p>
              {unit && <span className="text-sm text-muted">/ {unit}</span>}
            </div>
            {product.size && product.size !== "UNIQUE" && (
              <p className="mt-2 text-sm text-ink">
                Taille : <span className="font-semibold">{product.size}</span>
              </p>
            )}
          </div>

          {unit && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold text-ink">Quantité ({unit}s)</p>
              <QuantityStepper
                quantity={quantity}
                onChange={setQuantity}
                max={stock}
                className="w-full justify-between sm:w-auto sm:justify-start"
              />
            </div>
          )}

          <div className="mt-5 rounded-[10px] bg-[#fafaf8] p-4">
            <p className="text-sm font-semibold text-ink">Description</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
              {product.description || "Description"}
            </p>
          </div>

          {!unit && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold text-ink">Quantité</p>
              <QuantityStepper quantity={quantity} onChange={setQuantity} max={stock} />
            </div>
          )}

          <div className="mt-auto hidden gap-3 pt-6 lg:flex">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="min-w-0 flex-1 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-medium active:bg-brand-dark disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300"
            >
              {outOfStock ? "Rupture de stock" : added ? "✓ Ajouté au panier !" : "Ajouter au panier"}
            </button>
            <button
              type="button"
              onClick={() => setWishlist((selected) => !selected)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-black/20 text-muted transition hover:border-brand hover:text-brand-dark"
              aria-label="Ajouter aux favoris"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill={wishlist ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
              </svg>
            </button>
            <button
              type="button"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-black/20 text-muted transition hover:border-brand hover:text-brand-dark"
              aria-label="Partager le produit"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path strokeLinecap="round" d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
              </svg>
            </button>
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-2xl font-bold text-ink">{formatXof(product.price_xof)}</p>
            {unit && <p className="mt-1 text-sm text-muted">par {unit}</p>}
            <div className="mt-4 space-y-2 text-sm">
              <div className={`flex items-center gap-2 font-medium ${stockColorClass}`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  {outOfStock ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
                  )}
                </svg>
                {stockLabel}
              </div>
              <div className="flex items-center gap-2 text-muted">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v10H3zM14 11h4l3 3v3h-7z" />
                  <circle cx="7" cy="19" r="1.5" />
                  <circle cx="18" cy="19" r="1.5" />
                </svg>
                Livraison Cotonou : 24-48h
              </div>
            </div>
            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold">Quantité</p>
              <QuantityStepper quantity={quantity} onChange={setQuantity} max={stock} className="w-full justify-between" />
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="mt-5 w-full rounded-lg bg-brand px-6 py-3.5 font-semibold text-white transition hover:bg-brand-medium active:bg-brand-dark disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300"
            >
              {outOfStock ? "Rupture de stock" : added ? "✓ Ajouté !" : "Ajouter au panier"}
            </button>
            <div className="mt-4 space-y-2 border-t border-black/10 pt-4 text-xs text-muted">
              <div className="flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                </svg>
                Paiement sécurisé garanti
              </div>
              <div className="flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand">
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
                </svg>
                Confirmation par SMS sous 1h
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-3 border-t border-black/10 bg-white p-4 lg:hidden">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={outOfStock}
          className="min-w-0 flex-1 rounded-lg bg-brand px-6 py-3.5 font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {outOfStock ? "Rupture de stock" : added ? "✓ Ajouté !" : "Ajouter au panier"}
        </button>
        <button
          type="button"
          onClick={() => setWishlist((selected) => !selected)}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-black/20 text-muted"
          aria-label="Ajouter aux favoris"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill={wishlist ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
          </svg>
        </button>
      </div>
    </article>
  );
}
