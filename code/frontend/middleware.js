// Vercel Routing Middleware — meta tags Open Graph dynamiques pour les boutiques vendeur
// + manifest / icônes / titre PWA distincts pour le sous-domaine vendeur.
//
// Problèmes corrigés :
// 1. Le SPA React injecte ses balises <meta> og:* via react-helmet-async,
//    donc uniquement côté client. Les crawlers sociaux (WhatsApp, Facebook/Instagram,
//    Telegram, Slack, Discord, Pinterest...) n'exécutent pas le JS : ils reçoivent les
//    balises statiques génériques d'index.html, sans jamais voir le nom de la boutique.
// 2. index.html, <title>, <link rel="manifest"> et <meta name="apple-mobile-web-app-title">
//    sont identiques pour anifowoche.com et seller.anifowoche.com (même build SPA).
//    Résultat : les deux PWA ont le même nom "ANIFOWOCHE" et la même icône dorée sur
//    fond noir. Ce middleware réécrit ces balises côté serveur pour seller.anifowoche.com
//    afin de servir une identité PWA vendeur distincte (nom, manifest, icônes, couleurs).
//
// Ce fichier (middleware.js à la racine du projet, même niveau que package.json) est un
// Vercel Routing Middleware (edge runtime) — reconnu automatiquement par Vercel,
// indépendamment du framework Vite.
//
// Garanties :
//   - Aucun impact pour anifowoche.com : le domaine principal passe sans modification.
//   - Pour seller.anifowoche.com, le HTML servi contient le manifest, les icônes et le
//     titre vendeur, pour TOUS les visiteurs. Aucun appel API n'est fait pour ce besoin.
//   - Les crawlers sociaux sur une boutique vendeur continuent de recevoir les OG
//     personnalisés (nom/description de la boutique récupérés via l'API) tout en ayant
//     l'identité PWA vendeur.
//   - Fallback silencieux : si le index.html d'origine n'est pas joignable, next() —
//     le SPA est servi normalement.
//
// Ordre d'exécution Vercel : le Routing Middleware s'exécute AVANT le cache et le routage
// de la configuration (redirects/rewrites de vercel.json). Le matcher couvre donc
// /shop/:path* AVANT la redirection 301 vers seller.anifowoche.com.
import { next } from "@vercel/functions";

// Hôtes qui servent les boutiques vendeur publiques (voir App.jsx : le MÊME build sert
// anifowoche.com et seller.anifowoche.com, bascule sur window.location.hostname).
const SELLER_HOST = "seller.anifowoche.com";

// Robots sociaux + moteurs de recherche : ils bénéficient des meta tags servis côté
// serveur. Toute requête qui ne matche pas passe sans modification.
const BOT_USER_AGENT =
  /facebookexternalhit|Facebot|facebookcatalog|WhatsApp|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot|Pinterest|Googlebot|bingbot|DuckDuckBot|Baiduspider|YandexBot|Sogou|Applebot|Yeti|ia_archiver|AhrefsBot|SemrushBot/i;

// Routes internes du back-office vendeur servies par le même sous-domaine : un segment
// racine égal à l'une de ces valeurs n'est jamais un slug de boutique.
const SELLER_APP_PATHS = new Set(["login", "register", "dashboard", "orders", "products", "settings", "produits"]);

// Identité PWA vendeur. Doit rester cohérente avec public/manifest-seller.webmanifest
// et public/icon-seller.svg.
const SELLER_PWA = {
  title: "ANIF Seller — Votre vitrine en ligne",
  appleMobileWebAppTitle: "ANIF Seller",
  description: "Votre vitrine vendeur ANIFOWOCHE : catalogue, commandes et partage WhatsApp en un lien.",
  manifest: "/manifest-seller.webmanifest",
  icon: "/icon-seller.svg",
  appleTouchIcon: "/anifowoche-logo-seller.png",
  themeColor: "#1c1c1c",
  ogImage: "https://anifowoche.com/anifowoche-logo-seller.png",
  siteName: "ANIF Seller",
};

// Même variable que celle du build Vite (VITE_API_BASE_URL), lue au runtime edge.
// Défaut = URL de prod documentée dans .env.production.example / docs/ci-cd.md.
const API_BASE_URL = (process.env.VITE_API_BASE_URL || "https://anifowoche-backend.onrender.com/api").replace(/\/+$/, "");

// Timeout court : le crawler doit toujours recevoir une réponse rapidement.
const API_TIMEOUT_MS = 4000;

export const config = {
  matcher: ["/shop/:path*", "/:path"],
};

export default async function middleware(request) {
  // Ne jamais interférer avec les requêtes internes (fetch du index.html ci-dessous).
  if (request.headers.get("x-anifowoche-internal")) return next();

  if (request.method !== "GET") return next();

  const url = new URL(request.url);

  // --- 1. Sous-domaine vendeur : réécriture PWA pour tous les visiteurs ----------
  if (isSellerHost(url)) {
    return buildSellerResponse(request, url);
  }

  // --- 2. Domaine principal : réécriture OG uniquement pour les bots sur /shop/:slug
  const userAgent = request.headers.get("user-agent") ?? "";
  if (!BOT_USER_AGENT.test(userAgent)) return next();

  const slug = extractShopSlug(url);
  if (!slug) return next();

  const shop = await fetchShopMeta(slug);
  if (!shop || !shop.name) return next();

  return buildBotResponse(request, shop, `https://${SELLER_HOST}/${slug}`);
}

// Détecte si l'hôte est le sous-domaine vendeur (seller.anifowoche.com ou seller.*).
function isSellerHost(url) {
  return url.hostname === SELLER_HOST || url.hostname.startsWith("seller.");
}

// Détecte un slug de boutique selon l'hôte :
//   - sous-domaine seller.* : /{slug} (un seul segment, hors routes back-office et fichiers)
//   - domaine principal : /shop/{slug}
function extractShopSlug(url) {
  const segments = url.pathname.split("/").filter(Boolean);
  if (isSellerHost(url)) {
    if (segments.length !== 1) return null;
    const slug = segments[0];
    if (slug.includes(".") || SELLER_APP_PATHS.has(slug)) return null;
    return slug;
  }
  if (segments.length === 2 && segments[0] === "shop") return segments[1];
  return null;
}

// Récupère name/description de la boutique. Retourne null en cas d'échec quelconque
// (le middleware laisse alors la requête passer normalement).
async function fetchShopMeta(slug) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE_URL}/public/shops/${encodeURIComponent(slug)}/`, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = await response.json();
    return { name: data.name, description: data.description };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Construit la réponse pour le sous-domaine vendeur :
//   - manifest, icônes, titre, theme-color et meta apple-mobile-web-app-title vendeur
//     pour TOUS les visiteurs ;
//   - OG personnalisés UNIQUEMENT pour les crawlers sociaux sur une page boutique publique.
async function buildSellerResponse(request, url) {
  const userAgent = request.headers.get("user-agent") ?? "";
  const slug = extractShopSlug(url);
  let shop = null;
  if (slug && BOT_USER_AGENT.test(userAgent)) {
    shop = await fetchShopMeta(slug);
  }

  const html = await fetchOriginalHtml(request);
  if (!html) return next();

  const rewritten = rewriteSellerHtml(html, url, shop);
  return new Response(rewritten, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Réponse spécifique au sous-domaine : jamais mise en cache pour éviter qu'un
      // cache ne serve la variante vendeur sur le domaine principal.
      "cache-control": "no-cache",
      vary: "Host",
    },
  });
}

// Récupère le index.html d'origine (servi par le CDN Vercel).
async function fetchOriginalHtml(request) {
  try {
    const response = await fetch(new URL("/index.html", request.url), {
      headers: { "x-anifowoche-internal": "1" },
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

// Réécrit le HTML vendeur.
function rewriteSellerHtml(html, url, shop) {
  const fullTitle = shop?.name ? `${shop.name} — ANIF Seller` : SELLER_PWA.title;
  const description = shop?.description || SELLER_PWA.description;
  const canonicalUrl = url.href;
  const safeTitle = escapeHtml(fullTitle);
  const safeDescription = escapeHtml(description);
  const safeUrl = escapeHtml(canonicalUrl);

  let out = html.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`);

  out = replaceMetaContent(out, "name", "apple-mobile-web-app-title", SELLER_PWA.appleMobileWebAppTitle);
  out = replaceMetaContent(out, "name", "theme-color", SELLER_PWA.themeColor);
  out = replaceMetaContent(out, "name", "description", description);

  out = replaceLinkHref(out, "manifest", SELLER_PWA.manifest);
  out = replaceLinkHref(out, "icon", SELLER_PWA.icon);
  out = replaceLinkHref(out, "apple-touch-icon", SELLER_PWA.appleTouchIcon);

  out = out.replace(
    /<link[^>]*\brel\s*=\s*["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${safeUrl}" />`
  );

  out = replaceMetaContent(out, "property", "og:site_name", SELLER_PWA.siteName);
  out = replaceMetaContent(out, "property", "og:title", fullTitle);
  out = replaceMetaContent(out, "property", "og:description", description);
  out = replaceMetaContent(out, "property", "og:url", canonicalUrl);
  out = replaceMetaContent(out, "property", "og:image", SELLER_PWA.ogImage);

  if (/<meta[^>]*\bname\s*=\s*["']twitter:title["']/i.test(out)) {
    out = replaceMetaContent(out, "name", "twitter:title", fullTitle);
    out = replaceMetaContent(out, "name", "twitter:description", description);
  } else {
    out = out.replace(
      /<\/head>/i,
      `    <meta name="twitter:title" content="${safeTitle}" />\n    <meta name="twitter:description" content="${safeDescription}" />\n  </head>`
    );
  }

  return out;
}

// Réécrit le HTML pour les bots sociaux sur le domaine principal (/shop/:slug).
async function buildBotResponse(request, shop, canonicalUrl) {
  const html = await fetchOriginalHtml(request);
  if (!html) return next();

  const fullTitle = `${shop.name} — ANIFOWOCHE`;
  const description = shop.description || "";
  const safeTitle = escapeHtml(fullTitle);
  const safeDescription = escapeHtml(description);
  const safeUrl = escapeHtml(canonicalUrl);

  let out = html.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`);
  out = replaceMetaContent(out, "property", "og:title", fullTitle);
  out = replaceMetaContent(out, "property", "og:description", description);
  out = replaceMetaContent(out, "property", "og:url", canonicalUrl);
  out = out.replace(
    /<link[^>]*\brel\s*=\s*["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${safeUrl}" />`
  );
  if (/<meta[^>]*\bname\s*=\s*["']twitter:title["']/i.test(out)) {
    out = replaceMetaContent(out, "name", "twitter:title", fullTitle);
    out = replaceMetaContent(out, "name", "twitter:description", description);
  } else {
    out = out.replace(
      /<\/head>/i,
      `    <meta name="twitter:title" content="${safeTitle}" />\n    <meta name="twitter:description" content="${safeDescription}" />\n  </head>`
    );
  }

  return new Response(out, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-cache",
      vary: "User-Agent",
    },
  });
}

// Remplace le content="..." d'une balise <meta> dont l'attribut `attribute` vaut `key`.
// Sans correspondance, le HTML est retourné inchangé (fallback silencieux).
function replaceMetaContent(html, attribute, key, value) {
  const escaped = escapeHtml(value);
  const pattern = new RegExp(
    `(<meta[^>]*\\b${attribute}\\s*=\\s*["']${key}["'][^>]*\\bcontent\\s*=\\s*["'])[^"']*(["'])`,
    "i"
  );
  return html.replace(pattern, (match, prefix, quote) => `${prefix}${escaped}${quote}`);
}

// Remplace le href="..." d'une balise <link rel="...">.
function replaceLinkHref(html, rel, href) {
  const escaped = escapeHtml(href);
  const pattern = new RegExp(
    `(<link[^>]*\\brel\\s*=\\s*["']${rel}["'][^>]*\\bhref\\s*=\\s*["'])[^"']*(["'])`,
    "i"
  );
  return html.replace(pattern, (match, prefix, quote) => `${prefix}${escaped}${quote}`);
}

// Échappe le HTML pour éviter toute injection dans le <title> et les attributs content.
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
