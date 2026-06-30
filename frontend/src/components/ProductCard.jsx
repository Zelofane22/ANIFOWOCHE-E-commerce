import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  return (
    <Link
      to={`/produits/${product.slug}`}
      className="block rounded-lg border border-gray-200 p-3 hover:shadow-md"
    >
      <div className="aspect-square w-full rounded bg-gray-100" />
      <h3 className="mt-2 text-sm font-medium">{product.name}</h3>
      <p className="text-sm text-gray-600">{product.price_xof} F CFA</p>
    </Link>
  );
}
