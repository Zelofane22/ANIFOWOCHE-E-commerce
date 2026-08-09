import { useEffect, useState } from "react";
import { Link } from "react-router";
import { fetchBanners } from "../api/content.js";

// Contenu de secours si aucune bannière publiée n'est disponible.
const DEFAULT_HERO = {
  eyebrow: "ANIFOWOCHE",
  title: "Tissus, vêtements & accessoires",
  subtitle:
    "Des pièces sélectionnées pour le quotidien, les cérémonies et les sorties, avec paiement mobile money et livraison à domicile sur Cotonou.",
  ctaLabel: "Découvrir la collection",
  ctaUrl: "/catalogue",
};

// Bannière de la page d'accueil (section héro). Le contenu est pilotable depuis
// l'admin via le modèle content.Banner (titre, sous-titre, image, lien). Si
// aucune bannière n'est publiée ou si l'appel échoue, on retombe sur les
// valeurs par défaut ci-dessus.
export default function HeroSection() {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    let ignore = false;
    fetchBanners()
      .then((data) => {
        if (ignore) return;
        const banners = data?.results ?? data ?? [];
        setBanner(Array.isArray(banners) && banners.length > 0 ? banners[0] : null);
      })
      .catch(() => setBanner(null));
    return () => {
      ignore = true;
    };
  }, []);

  const title = banner?.title || DEFAULT_HERO.title;
  const subtitle = banner?.subtitle || DEFAULT_HERO.subtitle;
  const image = banner?.image || null;
  const ctaUrl = banner?.link_url || DEFAULT_HERO.ctaUrl;

  return (
    <section className="relative overflow-hidden bg-charcoal text-white">
      {image && (
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
    </section>
  );
}
