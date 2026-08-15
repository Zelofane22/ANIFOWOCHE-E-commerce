import { Helmet } from "react-helmet-async";
import { absoluteUrl } from "../utils/siteUrl.js";

const DEFAULT_DESCRIPTION =
  "Tissus locaux, vêtements et accessoires homme à Cotonou — livraison rapide, paiement Mobile Money et carte.";
const DEFAULT_IMAGE = absoluteUrl("/anifowoche-logo.png");

function buildBreadcrumbSchema(breadcrumbs) {
  if (!breadcrumbs || breadcrumbs.length === 0) return null;

  const items = breadcrumbs.map((crumb, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: crumb.name,
    ...(crumb.path ? { item: absoluteUrl(crumb.path) } : {}),
  }));

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ANIFOWOCHE",
    url: absoluteUrl("/"),
    logo: DEFAULT_IMAGE,
    sameAs: [],
  };
}

export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  jsonLd,
  breadcrumbs,
}) {
  const fullTitle = title ? `${title} — ANIFOWOCHE` : "ANIFOWOCHE — Tissus, vêtements & accessoires";
  const url = absoluteUrl(path);

  const schemas = [];

  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);
  if (breadcrumbSchema) schemas.push(breadcrumbSchema);

  if (type === "website" && path === "/" && !jsonLd) {
    schemas.push(buildOrganizationSchema());
  }

  const allSchemas = jsonLd ? [...schemas, jsonLd] : schemas;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="ANIFOWOCHE" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {allSchemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
