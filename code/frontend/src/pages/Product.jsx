import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { fetchProductBySlug } from "../api/products.js";
import QuantityStepper from "../components/QuantityStepper.jsx";
import { useCart } from "../context/CartContext.jsx";
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

  if (error) return <p className="text-red-600">Erreur : {error}</p>;
  if (!product) return <p className="text-muted">Chargement…</p>;

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAdded(true);
  };

  return (
    <article className="grid gap-6 pb-24 md:grid-cols-2 md:pb-0">
      <div className="aspect-square overflow-hidden rounded-xl bg-brand-pale">
        {product.image && (
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        )}
      </div>

      <div>
        {product.category?.name && (
          <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand-dark">
            {product.category.name}
          </span>
        )}
        <h1 className="mt-2 text-2xl font-bold text-ink">{product.name}</h1>
        <p className="mt-2 text-xl font-semibold text-brand-dark">{formatXof(product.price_xof)}</p>

        {product.size && product.size !== "UNIQUE" && (
          <p className="mt-4 text-sm text-ink">
            Taille : <span className="font-medium">{product.size}</span>
          </p>
        )}

        <p className="mt-4 whitespace-pre-line text-muted">{product.description}</p>

        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-ink">Quantité</p>
          <QuantityStepper quantity={quantity} onChange={setQuantity} />
        </div>

        <div className="mt-6 hidden gap-3 md:flex">
          <button
            type="button"
            onClick={handleAddToCart}
            className="rounded-lg bg-brand px-6 py-3 font-semibold text-ink transition hover:bg-brand-dark"
          >
            Ajouter au panier
          </button>
          {added && (
            <button
              type="button"
              onClick={() => navigate("/panier")}
              className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-ink"
            >
              Voir le panier
            </button>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white p-4 md:hidden">
        {added ? (
          <button
            type="button"
            onClick={() => navigate("/panier")}
            className="w-full rounded-lg bg-brand px-6 py-3 text-center font-semibold text-ink"
          >
            Voir le panier
          </button>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full rounded-lg bg-brand px-6 py-3 font-semibold text-ink"
          >
            Ajouter au panier
          </button>
        )}
      </div>
    </article>
  );
}
