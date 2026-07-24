// Génère public/sitemap.xml et public/robots.txt avant le build Vite, à partir
// des routes statiques + des produits actifs publiés par l'API Django. Écrit
// dans public/ pour que Vite copie ces fichiers tels quels dans dist/ (aucune
// route ne les intercepte : Vercel sert les fichiers statiques avant d'appliquer
// les rewrites du SPA, voir vercel.json).
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = (process.env.VITE_SITE_URL || "https://anifowoche.com").replace(/\/$/, "");
const API_BASE_URL = process.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const STATIC_PATHS = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/catalogue", changefreq: "daily", priority: "0.9" },
  { path: "/commande/public", changefreq: "weekly", priority: "0.7" },
];

async function fetchAllProductSlugs() {
  const slugs = [];
  let url = `${API_BASE_URL}/products/?page_size=100`;

  while (url) {
    let response;
    try {
      response = await fetch(url);
    } catch (err) {
      console.warn(`[sitemap] Impossible de contacter l'API (${err.message}) — sitemap généré sans produits.`);
      return slugs;
    }
    if (!response.ok) {
      console.warn(`[sitemap] Réponse API ${response.status} sur ${url} — sitemap généré sans produits.`);
      return slugs;
    }
    const data = await response.json();
    const results = data.results ?? data;
    for (const product of results) {
      if (product.slug) slugs.push(product.slug);
    }
    url = data.next ?? null;
  }

  return slugs;
}

function buildSitemapXml(entries) {
  const urlEntries = entries
    .map(
      ({ path, changefreq, priority }) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>\n`;
}

function buildRobotsTxt() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}

async function main() {
  const productSlugs = await fetchAllProductSlugs();
  const productEntries = productSlugs.map((slug) => ({
    path: `/produits/${slug}`,
    changefreq: "weekly",
    priority: "0.8",
  }));

  const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
  await mkdir(publicDir, { recursive: true });
  await writeFile(join(publicDir, "sitemap.xml"), buildSitemapXml([...STATIC_PATHS, ...productEntries]));
  await writeFile(join(publicDir, "robots.txt"), buildRobotsTxt());

  console.log(`[sitemap] sitemap.xml généré avec ${STATIC_PATHS.length + productEntries.length} URLs.`);
}

main();
