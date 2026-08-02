import { useEffect, useState } from "react";
import { Link } from "react-router";
import { fetchCategories, fetchProducts } from "../api/products.js";
import ProductCard from "../components/ProductCard.jsx";
import Seo from "../components/Seo.jsx";
import { useSiteConfig } from "../context/useSiteConfig.js";
import { optimizedImage } from "../utils/imageUrl.js";

// Arguments de confiance par défaut (fallback si theme.trust_arguments est vide).
const DEFAULT_TRUST_ARGUMENTS = [
  "Livraison sous 48h",
  "Paiement MTN, Moov, Visa",
  "Produits vérifiés",
  "Support WhatsApp",
];

// Ordre par défaut appliqué quand l'API /site-config/ n'a rien renvoyé.
const DEFAULT_SECTION_ORDER = ["trust", "categories", "featured"];

export default function Home() {
  const [topProducts, setTopProducts] = useState([]);
  const { orderedSections } = useSiteConfig();

  useEffect(() => {
    fetchProducts()
      .then((data) => {
        const products = data.results ?? data;
        setTopProducts(products.slice(0, 8));
      })
      .catch(() => setTopProducts([]));
  }, []);

  // Liste des types de sections à rendre, dans l'ordre.
  // Si l'API a renvoyé des sections -> on ne garde que celles activées, déjà triées.
  // Sinon (config indispo / échec) -> ordre par défaut, tout affiché.
  const sectionTypes = orderedSections
    ? orderedSections.filter((section) => section.enabled).map((section) => section.type)
    : DEFAULT_SECTION_ORDER;

  const renderSection = (type) => {
    switch (type) {
      case "trust":
        return (
          <div key="trust" className="mx-auto max-w-7xl px-4">
            <TrustSection />
          </div>
        );
      case "categories":
        return (
          <div key="categories" className="mx-auto max-w-7xl px-4">
            <CategoriesSection />
          </div>
        );
      case "featured":
        return (
          <div key="featured" className="mx-auto max-w-7xl px-4">
            <FeaturedSection products={topProducts} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <Seo path="/" />
      {sectionTypes.map((type) => renderSection(type))}
    </div>
  );
}

// --- Sections ---------------------------------------------------------------

function TrustSection() {
  const { theme } = useSiteConfig();
  const trustArguments =
    theme?.trust_arguments && theme.trust_arguments.length > 0
      ? theme.trust_arguments
      : DEFAULT_TRUST_ARGUMENTS;

  return (
    <div className="grid gap-3 border-b border-black/10 py-4 text-sm font-medium text-ink sm:grid-cols-2 lg:grid-cols-4">
      {trustArguments.map((label) => (
        <div key={label} className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-light text-brand-dark">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
            </svg>
          </span>
          {label}
        </div>
      ))}
    </div>
  );
}

function CategoriesSection() {
  const [categories, setCategories] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState({});

  useEffect(() => {
    let ignore = false;

    Promise.all([fetchCategories(), fetchProducts()])
      .then(([categoryData, productData]) => {
        if (ignore) return;
        const cats = categoryData.results ?? categoryData;
        const products = productData.results ?? productData;

        setCategories(cats);

        const grouped = {};
        products.forEach((product) => {
          const slug = product.category?.slug;
          if (!slug || !product.image) return;
          if (!grouped[slug]) grouped[slug] = [];
          grouped[slug].push(product);
        });
        setProductsByCategory(grouped);
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  // On n'affiche que les catégories ayant effectivement des produits disponibles.
  const visibleCategories = categories.filter(
    (category) => (productsByCategory[category.slug]?.length ?? 0) > 0
  );

  if (visibleCategories.length === 0) return null;

  return (
    <section className="py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink">Acheter par catégorie</h2>
          <div className="mt-1 h-0.5 w-12 rounded-full bg-brand" />
        </div>
        <Link to="/catalogue" className="text-sm font-semibold text-brand-dark hover:underline">
          Tout voir
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visibleCategories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            products={productsByCategory[category.slug]}
          />
        ))}
      </div>
    </section>
  );
}

function CategoryCard({ category, products }) {
  // Carrousel des images de couverture des produits disponibles de la catégorie.
  const images = products.map((product) => product.image);
  const slides = images.length;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides < 2) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [slides]);

  const count = products.length;

  return (
    <div className="group relative min-h-56 overflow-hidden rounded-lg bg-charcoal">
      <Link to={`/catalogue?category=${category.slug}`} aria-label={category.name} className="absolute inset-0 z-10" />

      <div className="absolute inset-0">
        {images.map((src, i) => (
          <img
            key={`${category.slug}-${i}`}
            src={optimizedImage(src, 700)}
            alt=""
            loading="lazy"
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
              i === index ? "scale-105 opacity-90" : "scale-100 opacity-0"
            }`}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/25 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 z-20 p-5">
        <h3 className="text-xl font-bold text-white">{category.name}</h3>
        <p className="mt-1 text-sm text-white/75">
          {count} produit{count > 1 ? "s" : ""} disponible
        </p>
      </div>

      {slides > 1 && (
        <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-4 bg-brand" : "w-1.5 bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FeaturedSection({ products }) {
  if (products.length === 0) return null;

  return (
    <section className="py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink">Top produits</h2>
          <div className="mt-1 h-0.5 w-12 rounded-full bg-brand" />
        </div>
        <Link to="/catalogue" className="text-sm font-semibold text-brand-dark hover:underline">
          Tout voir
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
