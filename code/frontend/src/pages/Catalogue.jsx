import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { fetchCategories, fetchProducts } from "../api/products.js";
import ProductCard from "../components/ProductCard.jsx";
import Seo from "../components/Seo.jsx";

export default function Catalogue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category");
  const search = searchParams.get("search") ?? "";
  const unit = searchParams.get("unit") ?? "";
  const minPrice = searchParams.get("min_price") ?? "";
  const maxPrice = searchParams.get("max_price") ?? "";
  const inStockOnly = searchParams.get("in_stock") === "1";
  const sort = searchParams.get("sort") ?? "";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState(search);
  const [syncedSearch, setSyncedSearch] = useState(search);

  if (search !== syncedSearch) {
    setSyncedSearch(search);
    setSearchInput(search);
  }

  const updateParams = (patch) => {
    const current = {
      category: activeCategory ?? "",
      search,
      unit,
      min_price: minPrice,
      max_price: maxPrice,
      in_stock: inStockOnly ? "1" : "",
      sort,
    };
    const next = { ...current, ...patch };
    const changed = Object.keys(next).some((key) => next[key] !== current[key]);
    if (!changed) return;

    setLoading(true);
    const cleaned = {};
    Object.entries(next).forEach(([key, value]) => {
      if (value) cleaned[key] = value;
    });
    setSearchParams(cleaned, { replace: true });
  };
  const updateParamsRef = useRef(updateParams);
  useEffect(() => {
    updateParamsRef.current = updateParams;
  });

  useEffect(() => {
    fetchCategories()
      .then((data) => setCategories(data.results ?? data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      updateParamsRef.current({ search: searchInput.trim() });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const params = {};
    if (activeCategory) params.category__slug = activeCategory;
    if (search.trim()) params.search = search.trim();
    if (unit) params.unit = unit;
    if (minPrice) params.price_xof__gte = minPrice;
    if (maxPrice) params.price_xof__lte = maxPrice;
    if (inStockOnly) params.stock__gt = 0;
    if (sort) params.ordering = sort;

    fetchProducts(params)
      .then((data) => setProducts(data.results ?? data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [activeCategory, search, unit, minPrice, maxPrice, inStockOnly, sort]);

  const hasActiveFilters = Boolean(unit || minPrice || maxPrice || inStockOnly || sort);

  if (error) return <p className="px-4 py-16 text-center text-red-600">Erreur : {error}</p>;

  return (
    <div>
      <Seo
        title="Catalogue"
        description="Parcourez tous les tissus, vêtements et accessoires homme disponibles chez ANIFOWOCHE, avec livraison à Cotonou."
        path="/catalogue"
      />
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
            <p className="text-sm font-semibold text-ink">
              {loading ? "…" : `${products.length} article${products.length > 1 ? "s" : ""}`}
            </p>
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
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
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
            onClick={() => updateParams({ category: "" })}
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
              onClick={() => updateParams({ category: category.slug })}
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

        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-black/10 pt-4">
          <label className="text-xs font-semibold text-ink">
            Prix min
            <input
              type="number"
              min="0"
              value={minPrice}
              onChange={(event) => updateParams({ min_price: event.target.value })}
              placeholder="0"
              className="mt-1 block w-24 rounded-lg border border-black/15 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Prix max
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(event) => updateParams({ max_price: event.target.value })}
              placeholder="—"
              className="mt-1 block w-24 rounded-lg border border-black/15 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Unité
            <select
              value={unit}
              onChange={(event) => updateParams({ unit: event.target.value })}
              className="mt-1 block rounded-lg border border-black/15 px-2 py-1.5 text-sm"
            >
              <option value="">Toutes</option>
              <option value="piece">Pièce</option>
              <option value="metre">Mètre</option>
            </select>
          </label>
          <label className="flex items-center gap-2 pb-1.5 text-xs font-semibold text-ink">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(event) => updateParams({ in_stock: event.target.checked ? "1" : "" })}
              className="h-4 w-4 rounded border-black/25"
            />
            En stock uniquement
          </label>
          <label className="text-xs font-semibold text-ink">
            Trier par
            <select
              value={sort}
              onChange={(event) => updateParams({ sort: event.target.value })}
              className="mt-1 block rounded-lg border border-black/15 px-2 py-1.5 text-sm"
            >
              <option value="">Pertinence</option>
              <option value="price_xof">Prix croissant</option>
              <option value="-price_xof">Prix décroissant</option>
            </select>
          </label>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => updateParams({ unit: "", min_price: "", max_price: "", in_stock: "", sort: "" })}
              className="pb-1.5 text-xs font-semibold text-brand-dark hover:underline"
            >
              Réinitialiser les filtres
            </button>
          )}
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

        {loading ? (
          <p className="py-20 text-center text-muted">Chargement…</p>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-muted">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-pale text-brand-dark">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              </svg>
            </div>
            <p className="font-semibold text-ink">Aucun produit trouvé</p>
            <p className="mt-1 text-sm">Essayez d'autres filtres ou une autre recherche.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 pb-8 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
