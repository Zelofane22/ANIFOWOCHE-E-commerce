import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchProductBySlug } from "../api/products.js";

export default function Product() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProductBySlug(slug)
      .then(setProduct)
      .catch((err) => setError(err.message));
  }, [slug]);

  if (error) return <p className="text-red-600">Erreur : {error}</p>;
  if (!product) return <p>Chargement…</p>;

  return (
    <article className="grid gap-6 md:grid-cols-2">
      <div className="aspect-square rounded bg-gray-100" />
      <div>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="mt-2 text-xl">{product.price_xof} F CFA</p>
        <p className="mt-4 text-gray-700">{product.description}</p>
        <button className="mt-6 rounded bg-gray-900 px-5 py-2 text-white">
          Ajouter au panier
        </button>
      </div>
    </article>
  );
}
