import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { fetchCategories, fetchProducts } from "../api/products.js";
import ProductCard from "../components/ProductCard.jsx";

export default function Catalogue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategory = searchParams.get("category");
  const urlSearch = searchParams.get("search") ?? "";
  const activeCategory = urlCategory;
  const search = urlSearch;
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
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

  const updateUrlParams = (category, term) => {
    const nextParams = {};
    if (category) nextParams.category = category;
    if (term.trim()) nextParams.search = term.trim();
    setSearchParams(nextParams, { replace: true });
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = !activeCategory || product.category?.slug === activeCategory;
      const matchesSearch = product.name.toLowerCase().includes(search.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, search]);

  if (loading) return <p className="px-4 py-16 text-center text-muted">Chargement…</p>;
  if (error) return <p className="px-4 py-16 text-center text-red-600">Erreur : {error}</p>;

  return (
    <div>
      <section className="bg-brand-pale">
        <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-dark">Catalogue</p>
          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-ink md:text-4xl">Tous nos produits</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Parcourez les tissus, vêtements et accessoires disponibles, puis commandez avec livraison sur Cotonou.
              </p>
            </div>
            <p className="text-sm font-semibold text-ink">{filteredProducts.length} article{filteredProducts.length > 1 ? "s" : ""}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-3 border-b border-black/10 py-4 text-xs font-semibold text-ink sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Livraison sous 48h",
            "Paiement sécurisé",
            "Prix boutique",
            "Support WhatsApp",
          ].map((label) => (
            <div key={label} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-brand" />
              {label}
            </div>
          ))}
        </div>

        <div className="py-5">
          <label className="sr-only" htmlFor="catalogue-search">
            Recherche produit
          </label>
          <div className="flex overflow-hidden rounded-lg border-2 border-brand bg-white">
            <input
              id="catalogue-search"
              type="search"
              value={search}
              onChange={(event) => {
                const value = event.target.value;
                updateUrlParams(activeCategory, value);
              }}
              placeholder="Rechercher un tissu, vêtement, accessoire..."
              className="min-w-0 flex-1 px-4 py-3 text-sm outline-none"
            />
            <span className="flex items-center bg-brand px-4 text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="m20 20-3.5-3.5" />
              </svg>
            </span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => {
              updateUrlParams(null, search);
            }}
            className={`shrink-0 whitespace-nowrap rounded-full border px-5 py-2 text-sm font-semibold transition ${
              activeCategory === null
                ? "border-brand bg-brand text-white"
                : "border-black/15 bg-white text-ink hover:border-brand hover:text-brand-dark"
            }`}
          >
            Tout
          </button>
          {categories.map((category) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => {
                updateUrlParams(category.slug, search);
              }}
              className={`shrink-0 whitespace-nowrap rounded-full border px-5 py-2 text-sm font-semibold transition ${
                activeCategory === category.slug
                  ? "border-brand bg-brand text-white"
                  : "border-black/15 bg-white text-ink hover:border-brand hover:text-brand-dark"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="mb-4 mt-7 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">
              {activeCategory
                ? categories.find((category) => category.slug === activeCategory)?.name ?? "Produits"
                : "Sélection ANIFOWOCHE"}
            </h2>
            <div className="mt-1 h-0.5 w-12 rounded-full bg-brand" />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-muted">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-pale text-brand-dark">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              </svg>
            </div>
            <p className="font-semibold text-ink">Aucun produit trouvé</p>
            <p className="mt-1 text-sm">Essayez une autre recherche ou une autre catégorie.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 pb-8 sm:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
