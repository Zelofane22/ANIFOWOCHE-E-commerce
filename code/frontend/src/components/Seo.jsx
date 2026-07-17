import { Helmet } from "react-helmet-async";
import { absoluteUrl } from "../utils/siteUrl.js";

const DEFAULT_DESCRIPTION =
  "Tissus locaux, vêtements et accessoires homme à Cotonou — livraison rapide, paiement Mobile Money et carte.";
const DEFAULT_IMAGE = absoluteUrl("/anifowoche-logo.png");

export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  jsonLd,
}) {
  const fullTitle = title ? `${title} — ANIFOWOCHE` : "ANIFOWOCHE — Tissus, vêtements & accessoires";
  const url = absoluteUrl(path);

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

      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
