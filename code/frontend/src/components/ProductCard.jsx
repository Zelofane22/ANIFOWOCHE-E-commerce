import { Link } from "react-router";
import { formatXof } from "../utils/format.js";

export default function ProductCard({ product }) {
  return (
    <Link
      to={`/produits/${product.slug}`}
      className="group block overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-brand-pale">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : null}
        {product.category?.name && (
          <span className="absolute left-2 top-2 rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand-dark">
            {product.category.name}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-ink">{product.name}</h3>
        <p className="mt-1 text-sm font-semibold text-ink">{formatXof(product.price_xof)}</p>
      </div>
    </Link>
  );
}
