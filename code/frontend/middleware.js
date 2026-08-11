// Vercel Routing Middleware — meta tags Open Graph dynamiques pour les boutiques vendeur.
//
// Problème corrigé : le SPA React injecte ses balises <meta> og:* via react-helmet-async,
// donc uniquement côté client. Les crawlers sociaux (WhatsApp, Facebook/Instagram,
// Telegram, Slack, Discord, Pinterest...) n'exécutent pas le JS : ils reçoivent les
// balises statiques génériques d'index.html, sans jamais voir le nom de la boutique.
//
// Ce fichier (middleware.js à la racine du projet, même niveau que package.json) est un
// Vercel Routing Middleware (edge runtime) — reconnu automatiquement par Vercel,
// indépendamment du framework Vite. Pour les robots uniquement, il réécrit dans le
// index.html servi :
//   - <title>, og:title, og:description, og:url (URL canonique seller.anifowoche.com/{slug})
//   - twitter:title, twitter:description (absents d'index.html → insérés avant </head>)
// avec les données de la boutique récupérées via GET {VITE_API_BASE_URL}/public/shops/{slug}/.
// og:image reste le logo par défaut (le modèle Shop n'a pas de champ logo).
//
// Garanties :
//   - Aucun impact pour les vrais utilisateurs : sans UA de bot, next() immédiat
//     (aucun appel réseau, pas de latence perceptible).
//   - Fallback silencieux : si l'API échoue (404, timeout, erreur réseau), next() —
//     le SPA est servi normalement, même derrière un proxy qui usurpe un UA de bot.
//   - Seules les routes boutique sont traitées : seller.anifowoche.com/{slug} (et
//     seller.*/{slug}) sur le sous-domaine vendeur, /shop/{slug} sur anifowoche.com.
//
// Ordre d'exécution Vercel : le Routing Middleware s'exécute AVANT le cache et le routage
// de la configuration (redirects/rewrites de vercel.json) — voir docs Vercel "Routing
// Middleware". Le matcher couvre donc /shop/:path* AVANT la redirection 301 vers
// seller.anifowoche.com. Si l'ordre venait à changer, les bots suivent de toute façon le
// 301 vers seller.anifowoche.com/{slug}, où le middleware s'applique aussi : les deux
// chemins sont couverts.
//
// Test manuel (une fois déployé) :
//   curl -s -H "User-Agent: facebookexternalhit/1.1" https://seller.anifowoche.com/<slug> | grep -E "<title>|og:title|og:description"
//   curl -s -H "User-Agent: WhatsApp/2.23" https://seller.anifowoche.com/<slug> | grep "og:description"
//   curl -s -H "User-Agent: TelegramBot (like TwitterBot)" https://anifowoche.com/shop/<slug> | grep -E "og:url|twitter:title"
//   curl -s -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130" https://seller.anifowoche.com/<slug> | grep -c "ANIFOWOCHE"  # identique à avant
//   + Facebook Sharing Debugger (https://developers.facebook.com/tools/debug/), LinkedIn Post Inspector.
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

  const userAgent = request.headers.get("user-agent") ?? "";
  if (!BOT_USER_AGENT.test(userAgent)) return next();

  const slug = extractShopSlug(new URL(request.url));
  if (!slug) return next();

  const shop = await fetchShopMeta(slug);
  if (!shop || !shop.name) return next();

  return buildBotResponse(request, shop, `https://${SELLER_HOST}/${slug}`);
}

// Détecte un slug de boutique selon l'hôte :
//   - sous-domaine seller.* : /{slug} (un seul segment, hors routes back-office et fichiers)
//   - domaine principal : /shop/{slug}
function extractShopSlug(url) {
  const segments = url.pathname.split("/").filter(Boolean);
  const isSellerHost = url.hostname === SELLER_HOST || url.hostname.startsWith("seller.");
  if (isSellerHost) {
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

// Récupère le index.html d'origine (servi par le CDN Vercel) et réécrit les balises
// meta de partage. Retourne null si le fichier n'est pas joignable (fallback silencieux).
async function buildBotResponse(request, shop, canonicalUrl) {
  let original;
  try {
    original = await fetch(new URL("/index.html", request.url), {
      headers: { "x-anifowoche-internal": "1" },
    });
  } catch {
    return null;
  }
  if (!original.ok) return null;
  const html = await original.text();

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
      // Réponse dédiée aux bots : jamais mise en cache pour éviter un aperçu périmé,
      // et Vary: User-Agent pour que le CDN ne mélange jamais les deux variantes.
      "cache-control": "no-cache",
      vary: "User-Agent",
    },
  });
}

// Remplace le content="..." d'une balise <meta> dont l'attribut `attribute` vaut `key`
// (ordre des attributs : `attribute` d'abord, puis `content` — format d'index.html).
// Sans correspondance, le HTML est retourné inchangé (fallback silencieux).
function replaceMetaContent(html, attribute, key, value) {
  const escaped = escapeHtml(value);
  const pattern = new RegExp(
    `(<meta[^>]*\\b${attribute}\\s*=\\s*["']${key}["'][^>]*\\bcontent\\s*=\\s*["'])[^"']*(["'])`,
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
