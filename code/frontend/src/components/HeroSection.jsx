import { useEffect, useState } from "react";
import { Link } from "react-router";
import { fetchBanners } from "../api/content.js";
import { fetchProducts } from "../api/products.js";
import ProductImage from "./ProductImage.jsx";

// Contenu de secours si aucune bannière publiée n'est disponible.
const DEFAULT_HERO = {
  eyebrow: "ANIFOWOCHE",
  title: "Tissus, vêtements & accessoires",
  subtitle:
    "Des pièces sélectionnées pour le quotidien, les cérémonies et les sorties, avec paiement mobile money et livraison à domicile sur Cotonou.",
  ctaLabel: "Découvrir la collection",
  ctaUrl: "/catalogue",
};

const SLIDE_INTERVAL_MS = 4500;
const MAX_SLIDES = 8;

// Bannière de la page d'accueil (section héro). Le contenu textuel est
// pilotable depuis l'admin via le modèle content.Banner (titre, sous-titre,
// image, lien). En fond sombre, un carrousel en fondu des images de couverture
// des produits actifs de la boutique (ets-anifowoche), chaque image renvoyant
// vers la fiche produit. Si aucun produit avec image n'est trouvé, la section
// retombe sur l'image de la bannière puis sur le fond sombre seul.
export default function HeroSection() {
  const [banner, setBanner] = useState(null);
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let ignore = false;

    fetchBanners()
      .then((data) => {
        if (ignore) return;
        const banners = data?.results ?? data ?? [];
        setBanner(Array.isArray(banners) && banners.length > 0 ? banners[0] : null);
      })
      .catch(() => setBanner(null));

    fetchProducts()
      .then((data) => {
        if (ignore) return;
        const products = data?.results ?? data ?? [];
        setSlides(
          products
            .filter((product) => product.slug && product.image)
            .slice(0, MAX_SLIDES)
            .map((product) => ({
              slug: product.slug,
              image: product.image,
              name: product.name,
            }))
        );
      })
      .catch(() => setSlides([]));

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (slides.length < 2 || paused) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [slides.length, paused]);

  const title = banner?.title || DEFAULT_HERO.title;
  const subtitle = banner?.subtitle || DEFAULT_HERO.subtitle;
  const image = banner?.image || null;
  const ctaUrl = banner?.link_url || DEFAULT_HERO.ctaUrl;

  return (
    <section
      className="relative overflow-hidden bg-charcoal text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.length > 0 && (
        <div className="absolute inset-0" aria-hidden="true">
          {slides.map((slide, i) => (
            <Link
              key={slide.slug}
              to={`/produits/${slide.slug}`}
              tabIndex={i === index ? 0 : -1}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                i === index ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <ProductImage
                src={slide.image}
                alt=""
                loading={i === index ? "eager" : "lazy"}
                className="absolute inset-0 h-full w-full object-cover opacity-50"
              />
            </Link>
          ))}
        </div>
      )}
      {slides.length === 0 && image && (
        <img
          src={image}
          alt=""
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/80 to-charcoal/40" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-24 lg:py-28">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">{DEFAULT_HERO.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{title}</h1>
          {subtitle && (
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">{subtitle}</p>
          )}
          <Link
            to={ctaUrl}
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-medium focus-visible:outline-offset-4"
          >
            {DEFAULT_HERO.ctaLabel}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0-6-6m6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.slug}
              type="button"
              aria-label={`Voir le produit ${slide.name}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-4 bg-brand" : "w-1.5 bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
