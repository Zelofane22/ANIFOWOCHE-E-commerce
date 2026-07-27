import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getPublicShop, getPublicShopProduct } from "../api/seller.js";
import { StoreIcon } from "../components/icons.jsx";
import { formatXof } from "../utils/format.js";
import { optimizedImage } from "../utils/imageUrl.js";

export default function SellerProductDetail() {
  const { slug: shopSlug, productSlug } = useParams();
  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([
      getPublicShopProduct(shopSlug, productSlug),
      getPublicShop(shopSlug),
    ])
      .then(([productData, shopData]) => {
        setProduct(productData);
        setShop(shopData);
      })
      .catch(() => setNotFound(true));
  }, [shopSlug, productSlug]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] px-4 py-10 text-center">
        <StoreIcon size={34} className="mx-auto text-muted" />
        <h1 className="mt-4 text-xl font-bold text-ink">Produit introuvable</h1>
        <Link
          to={`/${shopSlug}`}
          className="mt-5 inline-block rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white"
        >
          Retour à la boutique
        </Link>
      </div>
    );
  }

  if (!product) {
    return <div className="min-h-screen bg-[#f7f6f2] px-4 py-10 text-center text-muted">Chargement...</div>;
  }

  const whatsappPhone = shop?.whatsapp_phone?.replace("+", "") || "";
  const whatsappMessage = `Bonjour, je souhaite commander : ${product.name} (${formatXof(product.price_xof)})`;

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-ink">
      <header className="border-b border-black/10 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <Link to={`/${shopSlug}`} className="text-sm text-muted hover:text-brand transition">
            &larr; Retour
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-brand-pale">
            {product.image ? (
              <img
                src={optimizedImage(product.image, 600)}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-brand-dark">
                {product.name?.[0] || "?"}
              </div>
            )}
            {product.stock <= 0 && (
              <span className="absolute right-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                Rupture
              </span>
            )}
          </div>

          <div>
            {product.category && (
              <p className="text-xs font-semibold text-brand-dark uppercase tracking-wide">
                {product.category.name}
              </p>
            )}
            <h1 className="mt-2 text-2xl font-bold text-ink">{product.name}</h1>

            {product.stock > 0 && product.stock <= 10 && (
              <p className="mt-2 text-sm font-medium text-amber-600">
                Plus que {product.stock} en stock
              </p>
            )}

            <p className="mt-4 text-3xl font-bold text-ink">{formatXof(product.price_xof)}</p>
            {product.unit && product.unit !== "piece" && (
              <span className="ml-1 text-sm text-muted">/ {product.unit}</span>
            )}

            {product.description && (
              <p className="mt-6 text-sm leading-6 text-muted whitespace-pre-line">{product.description}</p>
            )}

            {product.colors?.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-ink mb-2">Couleurs disponibles</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm"
                    >
                      <span
                        className="inline-block h-4 w-4 rounded-full border border-black/10"
                        style={{ backgroundColor: color.hex || "#ccc" }}
                      />
                      <span>{color.name}</span>
                      {color.stock !== undefined && (
                        <span className="text-xs text-muted">({color.stock})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3">
              <a
                href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-green-700"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Contacter le vendeur sur WhatsApp
              </a>
              <Link
                to={`/${shopSlug}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-black/15 bg-white px-6 py-3 text-sm font-bold text-ink transition hover:bg-gray-50"
              >
                Voir tous les produits
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}