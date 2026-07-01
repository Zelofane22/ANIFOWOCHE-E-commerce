import { useEffect, useMemo, useState } from "react";
import { fetchCategories, fetchProducts } from "../api/products.js";
import ProductCard from "../components/ProductCard.jsx";

export default function Catalogue() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()])
      .then(([productsData, categoriesData]) => {
        setProducts(productsData.results ?? productsData);
        setCategories(categoriesData.results ?? categoriesData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = !activeCategory || product.category?.slug === activeCategory;
      const matchesSearch = product.name.toLowerCase().includes(search.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, search]);

  if (loading) return <p className="py-10 text-center text-muted">Chargement…</p>;
  if (error) return <p className="py-10 text-center text-red-600">Erreur : {error}</p>;

  return (
    <div>
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Recherche produit..."
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
      />

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ${
            activeCategory === null
              ? "bg-brand text-ink"
              : "border border-gray-300 text-ink"
          }`}
        >
          Tout
        </button>
        {categories.map((category) => (
          <button
            key={category.slug}
            type="button"
            onClick={() => setActiveCategory(category.slug)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ${
              activeCategory === category.slug
                ? "bg-brand text-ink"
                : "border border-gray-300 text-ink"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <p className="py-10 text-center text-muted">Aucun produit ne correspond à votre recherche.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
