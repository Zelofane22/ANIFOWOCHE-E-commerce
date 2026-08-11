/**
 * Ajuste les métadonnées PWA (<title>, manifest, icônes, theme-color,
 * apple-mobile-web-app-title) pour le sous-domaine vendeur.
 *
 * Ce script s'exécute tôt dans src/main.jsx, avant le rendu React.
 * Il est un filet de sécurité pour les environnements sans le middleware
 * Vercel (développement local, preview non-Vercel) et renforce le
 * comportement côté client en complément du HTML réécrit par le serveur.
 */

const SELLER_HOST = "seller.anifowoche.com";

function isSellerSubdomain() {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  return (
    hostname === SELLER_HOST ||
    hostname.startsWith("seller.") ||
    window.location.search.includes("seller=1")
  );
}

function setLink(rel, href) {
  let link = document.querySelector(`link[rel="${rel}"]`);
  if (link) {
    link.href = href;
  } else {
    link = document.createElement("link");
    link.rel = rel;
    link.href = href;
    document.head.appendChild(link);
  }
}

function setMeta(name, content) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (meta) {
    meta.content = content;
  } else {
    meta = document.createElement("meta");
    meta.name = name;
    meta.content = content;
    document.head.appendChild(meta);
  }
}

export function initPwaMeta() {
  if (!isSellerSubdomain()) return;

  document.title = "ANIF Seller — Votre vitrine en ligne";

  setMeta("apple-mobile-web-app-title", "ANIF Seller");
  setMeta("theme-color", "#1c1c1c");

  setLink("manifest", "/manifest-seller.webmanifest");
  setLink("icon", "/icon-seller.svg");
  setLink("apple-touch-icon", "/anifowoche-logo-seller.png");
}
