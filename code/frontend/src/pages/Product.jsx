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

  useEffect(() => {
    fetchProductBySlug(slug)
      .then(setProduct)
      .catch((err) => setError(err.message));
  }, [slug]);

  if (error) return <p className="px-4 py-16 text-center text-red-600">Erreur : {error}</p>;
  if (!product) return <p className="px-4 py-16 text-center text-muted">Chargement…</p>;

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAdded(true);
  };

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
        <div>
          <div className="aspect-square overflow-hidden rounded-xl bg-brand-pale">
            {product.image ? (
              <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-brand-dark">
                ANIFOWOCHE
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          {product.category?.name && (
            <span className="mb-3 w-fit rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand-dark">
              {product.category.name}
            </span>
          )}
          <h1 className="text-2xl font-bold leading-tight text-ink md:text-3xl">{product.name}</h1>

          <div className="mt-3 flex items-center gap-2 border-b border-black/10 pb-4">
            <span className="text-sm text-brand" aria-hidden="true">
              ★★★★★
            </span>
            <span className="text-sm font-semibold text-brand-dark">Produit vérifié</span>
            <span className="text-sm text-muted">Livraison Cotonou</span>
          </div>

          <div className="mt-5">
            <p className="text-3xl font-bold text-ink">{formatXof(product.price_xof)}</p>
            {product.size && product.size !== "UNIQUE" && (
              <p className="mt-2 text-sm text-ink">
                Taille : <span className="font-semibold">{product.size}</span>
              </p>
            )}
          </div>

          <div className="mt-5 rounded-lg bg-brand-pale p-4">
            <p className="text-sm font-semibold text-ink">Description</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">{product.description}</p>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-ink">Quantité</p>
            <QuantityStepper quantity={quantity} onChange={setQuantity} />
          </div>

          <div className="mt-6 hidden gap-3 lg:flex">
            <button
              type="button"
              onClick={handleAddToCart}
              className="rounded-lg bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-medium"
            >
              {added ? "Ajouté au panier" : "Ajouter au panier"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/panier")}
              className="rounded-lg border border-black/15 px-6 py-3 font-semibold text-ink transition hover:border-brand hover:text-brand-dark"
            >
              Voir le panier
            </button>
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-2xl font-bold text-ink">{formatXof(product.price_xof)}</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 font-medium text-green-700">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
                </svg>
                En stock
              </div>
              <div className="flex items-center gap-2 text-muted">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v10H3zM14 11h4l3 3v3h-7z" />
                  <circle cx="7" cy="19" r="1.5" />
                  <circle cx="18" cy="19" r="1.5" />
                </svg>
                Livraison 24-48h à Cotonou
              </div>
            </div>
            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold">Quantité</p>
              <QuantityStepper quantity={quantity} onChange={setQuantity} />
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              className="mt-5 w-full rounded-lg bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-medium"
            >
              {added ? "Ajouté !" : "Ajouter au panier"}
            </button>
            <div className="mt-4 border-t border-black/10 pt-4 text-xs leading-6 text-muted">
              <p>Paiement sécurisé par Mobile Money ou carte.</p>
              <p>Confirmation de commande après paiement.</p>
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-black/10 bg-white p-4 lg:hidden">
        {added ? (
          <button
            type="button"
            onClick={() => navigate("/panier")}
            className="w-full rounded-lg bg-brand px-6 py-3 text-center font-semibold text-white"
          >
            Voir le panier
          </button>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full rounded-lg bg-brand px-6 py-3 font-semibold text-white"
          >
            Ajouter au panier
          </button>
        )}
      </div>
    </article>
  );
}
