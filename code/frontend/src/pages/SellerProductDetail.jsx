import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { createOrder } from "../api/orders.js";
import { geolocateZone } from "../api/delivery.js";
import { getPublicShop, getPublicShopProduct } from "../api/seller.js";
import { StoreIcon } from "../components/icons.jsx";
import { extractErrorMessage } from "../utils/apiError.js";
import { formatXof } from "../utils/format.js";
import ProductImage from "../components/ProductImage.jsx";
import { buildWhatsappUrl } from "../utils/whatsappPhone.js";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-black/15 px-4 py-3 text-sm text-ink placeholder:text-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/15";

export default function SellerProductDetail() {
  const { slug: shopSlug, productSlug } = useParams();
  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [form, setForm] = useState({ fullName: "", phone: "", address: "" });
  const [selectedZone, setSelectedZone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);

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

  const deliveryZones = useMemo(() => shop?.delivery_zones ?? [], [shop?.delivery_zones]);
  const zone = useMemo(
    () => deliveryZones.find((z) => String(z.id) === String(selectedZone)),
    [deliveryZones, selectedZone]
  );

  const canIncreaseQuantity = useMemo(() => {
    if (product?.made_to_order) return true;
    return (product?.stock ?? 0) > quantity;
  }, [product, quantity]);

  const productTotal = useMemo(
    () => (product?.price_xof ?? 0) * quantity,
    [product, quantity]
  );
  const deliveryFee = zone?.fee_xof ?? 0;
  const total = productTotal + deliveryFee;

  const canSubmit = Boolean(
    zone &&
      form.fullName.trim() &&
      form.phone.trim() &&
      form.address.trim() &&
      quantity > 0 &&
      !submitting &&
      (product?.made_to_order || (product?.stock ?? 0) >= quantity)
  );

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await geolocateZone({
            latitude: parseFloat(position.coords.latitude.toFixed(6)),
            longitude: parseFloat(position.coords.longitude.toFixed(6)),
          });
          const matchedZone = result?.zone;
          if (
            matchedZone &&
            deliveryZones.some((z) => String(z.id) === String(matchedZone.id))
          ) {
            setSelectedZone(String(matchedZone.id));
          } else {
            setGeoError("Votre position n'est pas desservie par cette boutique.");
          }
        } catch {
          setGeoError("Impossible de vérifier votre position. Veuillez choisir une zone manuellement.");
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoError("Impossible d'accéder à votre position. Veuillez choisir une zone manuellement.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const created = await createOrder({
        full_name: form.fullName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: "Cotonou",
        items: [{ product_id: product.id, quantity }],
        delivery_zone_id: Number(selectedZone),
      });
      setOrder(created);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

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

  const whatsappMessage = order
    ? `Bonjour, je confirme ma commande ${order.reference || `#CMD-${String(order.id).padStart(6, "0")}`}.\n\nProduit : ${product.name}\nQuantité : ${quantity}\nPrix unitaire : ${formatXof(product.price_xof)}\nFrais de livraison (${zone.name}) : ${formatXof(zone.fee_xof)}\nTotal : ${formatXof(order.total_xof)}\n\nNom : ${form.fullName.trim()}\nTéléphone : ${form.phone.trim()}\nAdresse : ${form.address.trim()}\n\nMerci !`
    : "";
  const whatsappUrl = buildWhatsappUrl(shop?.whatsapp_phone, whatsappMessage);

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
              <ProductImage
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-brand-dark">
                {product.name?.[0] || "?"}
              </div>
            )}
            {!product.made_to_order && product.stock <= 0 && (
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

            {!product.made_to_order && product.stock > 0 && product.stock <= 10 && (
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

            {order ? (
              <div className="mt-8 rounded-xl border border-black/10 bg-white p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="mt-4 text-lg font-bold text-ink">Commande confirmée</h2>
                <p className="mt-1 text-sm text-muted">
                  Votre commande <span className="font-semibold text-ink">{order.reference || `#CMD-${String(order.id).padStart(6, "0")}`}</span> a bien été enregistrée.
                </p>

                <div className="mt-5 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Produit</span>
                    <span className="font-semibold text-ink">{product.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Quantité</span>
                    <span className="font-semibold text-ink">{quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Zone de livraison</span>
                    <span className="font-semibold text-ink">{zone?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Frais de livraison</span>
                    <span className="font-semibold text-ink">{formatXof(zone?.fee_xof ?? 0)}</span>
                  </div>
                  <div className="flex justify-between border-t border-black/10 pt-2 text-base font-bold text-ink">
                    <span>Total</span>
                    <span>{formatXof(order.total_xof)}</span>
                  </div>
                </div>

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-green-700"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Contacter le vendeur sur WhatsApp
                  </a>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {error && (
                  <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </p>
                )}

                <div>
                  <label className="block text-sm font-semibold text-ink">
                    Zone de livraison *
                    <select
                      value={selectedZone}
                      onChange={(e) => setSelectedZone(e.target.value)}
                      required
                      className={inputClass}
                    >
                      <option value="">Choisir une zone</option>
                      {deliveryZones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name} · {formatXof(z.fee_xof)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGeolocate}
                      disabled={geoLoading}
                      className="text-xs font-semibold text-brand-dark underline hover:text-brand disabled:text-muted"
                    >
                      {geoLoading ? "Localisation…" : "Utiliser ma position"}
                    </button>
                    {geoError && <span role="alert" className="text-xs text-red-600">{geoError}</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink">
                    Quantité *
                    <div className="mt-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-black/15 text-lg font-semibold text-ink transition hover:border-brand"
                        aria-label="Diminuer la quantité"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={product.made_to_order ? undefined : product.stock}
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(
                            Math.max(
                              1,
                              Math.min(
                                product.made_to_order ? Number.MAX_SAFE_INTEGER : product.stock,
                                Number(e.target.value) || 1
                              )
                            )
                          )
                        }
                        className="h-10 w-20 rounded-lg border border-black/15 text-center text-sm font-semibold text-ink focus:border-brand"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => (canIncreaseQuantity ? q + 1 : q))}
                        disabled={!canIncreaseQuantity}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-lg font-semibold text-white transition hover:bg-brand-medium disabled:bg-gray-300"
                        aria-label="Augmenter la quantité"
                      >
                        +
                      </button>
                    </div>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-ink">
                    Nom complet *
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => updateForm("fullName", e.target.value)}
                      required
                      className={inputClass}
                      placeholder="Prénom et nom"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-ink">
                    Téléphone WhatsApp *
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateForm("phone", e.target.value)}
                      required
                      className={inputClass}
                      placeholder="01 XX XX XX XX"
                    />
                  </label>
                </div>

                <label className="block text-sm font-semibold text-ink">
                  Adresse de livraison *
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => updateForm("address", e.target.value)}
                    required
                    className={inputClass}
                    placeholder="Quartier, rue, repère proche"
                  />
                </label>

                <div className="rounded-lg border border-black/10 bg-white p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Produit ({quantity})</span>
                    <span className="font-semibold text-ink">{formatXof(productTotal)}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-muted">Livraison {zone ? `(${zone.name})` : ""}</span>
                    <span className="font-semibold text-ink">{formatXof(deliveryFee)}</span>
                  </div>
                  <div className="mt-3 flex justify-between border-t border-black/10 pt-3 text-base font-bold text-ink">
                    <span>Total</span>
                    <span>{formatXof(total)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full rounded-lg bg-brand px-6 py-3.5 text-sm font-bold text-white transition hover:bg-brand-medium disabled:bg-gray-200 disabled:text-gray-500"
                >
                  {submitting ? "Confirmation…" : "Confirmer la commande"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
