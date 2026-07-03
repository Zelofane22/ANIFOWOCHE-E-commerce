import { Link } from "react-router";
import { formatXof } from "../utils/format.js";

export default function ProductCard({ product }) {
  const stock = product.stock ?? 0;
  const outOfStock = stock <= 0;
  const lowStock = !outOfStock && stock <= 5;

  return (
    <Link
      to={`/produits/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-black/10 bg-white transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-brand-pale">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-medium text-brand-dark">
            ANIFOWOCHE
          </div>
        )}
        {product.category?.name && (
          <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-brand-dark shadow-sm">
            {product.category.name}
          </span>
        )}
        {(outOfStock || lowStock) && (
          <span
            className={`absolute right-2 top-2 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow-sm ${
              outOfStock ? "bg-red-600" : "bg-amber-600"
            }`}
          >
            {outOfStock ? "Rupture" : `Plus que ${stock}`}
          </span>
        )}
        {product.discount_percent > 0 && (
          <span className="absolute bottom-2 left-2 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            -{product.discount_percent}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-ink transition group-hover:text-brand-dark">
          {product.name}
        </h3>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          {product.review_count > 0 ? (
            <>
              <span className="text-brand" aria-hidden="true">
                ★
              </span>
              <span className="font-semibold text-ink">{Number(product.rating_average).toFixed(1)}</span>
              <span>({product.review_count})</span>
            </>
          ) : (
            <span>Pas encore d'avis</span>
          )}
        </div>
        <div className="mt-0.5 text-xs text-muted">Livraison Cotonou</div>
        <div className="mt-auto pt-3">
          {product.discount_percent > 0 ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <p className="text-base font-bold text-red-600">{formatXof(product.discounted_price_xof)}</p>
              <p className="text-xs text-muted line-through">{formatXof(product.price_xof)}</p>
            </div>
          ) : (
            <p className="text-base font-bold text-ink">{formatXof(product.price_xof)}</p>
          )}
          <span className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition group-hover:bg-brand-medium">
            Voir le produit
          </span>
        </div>
      </div>
    </Link>
  );
}
