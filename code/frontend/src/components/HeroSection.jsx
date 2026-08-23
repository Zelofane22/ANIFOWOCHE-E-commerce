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

// Bannière de la page d'accueil (section héro). En fond sombre, un carrousel
// en fondu des bannières promo publiées depuis l'admin (modèle content.Banner :
// titre, sous-titre, image, lien, is_published, order). Chaque bannière renvoie
// vers son lien configuré. Si aucune bannière publiée n'est trouvée, la section
// retombe sur un carrousel des images de couverture des produits actifs de la
// boutique, chaque image renvoyant vers la fiche produit.
export default function HeroSection() {
  const [banners, setBanners] = useState([]);
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let ignore = false;

    fetchBanners()
      .then((data) => {
        if (ignore) return;
        const bannerList = data?.results ?? data ?? [];
        setBanners(bannerList);
        if (Array.isArray(bannerList) && bannerList.length > 0) {
          setSlides(
            bannerList
              .slice(0, MAX_SLIDES)
              .map((banner) => ({
                kind: "banner",
                key: `banner-${banner.id ?? banner.title}`,
                image: banner.image || null,
                to: banner.link_url || "/",
                title: banner.title,
                subtitle: banner.subtitle,
              }))
          );
        }
      })
      .catch(() => setBanners([]));

    fetchProducts()
      .then((data) => {
        if (ignore) return;
        const products = data?.results ?? data ?? [];
        setSlides((current) =>
          current.length > 0
            ? current
            : products
                .filter((product) => product.slug && product.image)
                .slice(0, MAX_SLIDES)
                .map((product) => ({
                  kind: "product",
                  key: `product-${product.slug}`,
                  image: product.image,
                  to: `/produits/${product.slug}`,
                  name: product.name,
                }))
        );
      })
      .catch(() => {});

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

  const current = slides[index] ?? null;
  const isBannerSlide = current?.kind === "banner";
  const fallbackBanner = banners[0];

  const title = isBannerSlide
    ? current.title || DEFAULT_HERO.title
    : fallbackBanner?.title || DEFAULT_HERO.title;
  const subtitle = isBannerSlide
    ? current.subtitle || DEFAULT_HERO.subtitle
    : fallbackBanner?.subtitle || DEFAULT_HERO.subtitle;
  const ctaUrl = isBannerSlide
    ? current.to
    : fallbackBanner?.link_url || DEFAULT_HERO.ctaUrl;

  const renderSlide = (slide, i) => {
    const visible = i === index;
    const isBanner = slide.kind === "banner";
    const className = `absolute inset-0 transition-opacity duration-1000 ${
      visible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
    }`;
    const inner = slide.image ? (
      <ProductImage
        src={slide.image}
        alt=""
        loading={visible ? "eager" : "lazy"}
        className="absolute inset-0 h-full w-full object-cover opacity-50"
      />
    ) : null;
    const slideProps = {
      tabIndex: visible ? 0 : -1,
      className,
      "aria-label": isBanner
        ? `Voir la bannière ${slide.title}`
        : `Voir le produit ${slide.name}`,
    };

    if (isBanner && /^https?:\/\//i.test(slide.to)) {
      return (
        <a key={slide.key} href={slide.to} {...slideProps}>
          {inner}
        </a>
      );
    }
    return (
      <Link key={slide.key} to={slide.to} {...slideProps}>
        {inner}
      </Link>
    );
  };

  return (
    <section
      className="relative overflow-hidden bg-charcoal text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.length > 0 && (
        <div className="absolute inset-0" aria-hidden="true">
          {slides.map(renderSlide)}
        </div>
      )}
      {slides.length === 0 && fallbackBanner?.image && (
        <img
          src={fallbackBanner.image}
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
          {(() => {
            const href = /^https?:\/\//i.test(ctaUrl);
            const cls =
              "mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-medium focus-visible:outline-offset-4";
            const inner = (
              <>
                {DEFAULT_HERO.ctaLabel}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0-6-6m6 6-6 6" />
                </svg>
              </>
            );
            return href ? (
              <a href={ctaUrl} className={cls}>
                {inner}
              </a>
            ) : (
              <Link to={ctaUrl} className={cls}>
                {inner}
              </Link>
            );
          })()}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.key}
              type="button"
              aria-label={
                slide.kind === "banner"
                  ? `Voir la bannière ${slide.title}`
                  : `Voir le produit ${slide.name}`
              }
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
