import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { fetchProductBySlug } from "../api/products.js";
import { createReview, fetchProductReviews } from "../api/reviews.js";
import { addToWishlist, fetchWishlistStatus, removeFromWishlist } from "../api/wishlist.js";
import QuantityStepper from "../components/QuantityStepper.jsx";
import Seo from "../components/Seo.jsx";
import { useAuth } from "../context/useAuth.js";
import { useCart } from "../context/useCart.js";
import { extractErrorMessage } from "../utils/apiError.js";
import { formatXof } from "../utils/format.js";
import { optimizedImage } from "../utils/imageUrl.js";
import ProductImage from "../components/ProductImage.jsx";
import { absoluteUrl } from "../utils/siteUrl.js";

export default function Product() {
  const { slug } = useParams();
  return <ProductView key={slug} slug={slug} />;
}

function ProductView({ slug }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [shared, setShared] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});

  useEffect(() => {
    fetchProductBySlug(slug)
      .then(setProduct)
      .catch((err) => {
        if (err?.response?.status === 404) {
          setNotFound(true);
        } else {
          setError(err.message);
        }
      });
  }, [slug]);

  useEffect(() => {
    if (!isAuthenticated || !product) return;
    fetchWishlistStatus(product.id)
      .then(() => setWishlisted(true))
      .catch(() => setWishlisted(false));
  }, [isAuthenticated, product]);

  if (notFound) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-lg font-semibold text-ink">Produit introuvable</p>
        <p className="mt-2 text-sm text-muted">Ce produit n&apos;existe plus ou n&apos;est pas disponible.</p>
        <button
          type="button"
          onClick={() => navigate("/catalogue")}
          className="mt-6 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-medium"
        >
          Retour au catalogue
        </button>
      </div>
    );
  }
  if (error) return <p className="px-4 py-16 text-center text-red-600">Erreur : {error}</p>;
  if (!product) return <p className="px-4 py-16 text-center text-muted">Chargement…</p>;

  const productInStock = product.in_stock ?? (Boolean(product.made_to_order) || (product.stock ?? 0) > 0);

  const handleAddToCart = () => {
    if (!productInStock) return;
    const selectedColorData = selectedColor
      ? product.colors.find((c) => c.name === selectedColor)
      : null;
    const optionsPayload = [];
    for (const [groupId, optionIds] of Object.entries(selectedOptions)) {
      const group = product.option_groups?.find((g) => String(g.id) === groupId);
      if (!group) continue;
      for (const optId of optionIds) {
        const opt = group.options.find((o) => String(o.id) === String(optId));
        if (opt) {
          optionsPayload.push({
            group_id: group.id,
            group_name: group.name,
            option_id: opt.id,
            option_name: opt.name,
            price_xof: opt.price_xof,
          });
        }
      }
    }
    addItem(
      { ...product, selectedColor: selectedColorData || null, selectedOptions: optionsPayload },
      quantity
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  };

  const handleOptionToggle = (groupId, optionId, maxSelections) => {
    setSelectedOptions((prev) => {
      const current = prev[groupId] || [];
      if (current.includes(String(optionId))) {
        return { ...prev, [groupId]: current.filter((id) => id !== String(optionId)) };
      }
      if (maxSelections === 1) {
        return { ...prev, [groupId]: [String(optionId)] };
      }
      if (maxSelections > 0 && current.length >= maxSelections) {
        return prev;
      }
      return { ...prev, [groupId]: [...current, String(optionId)] };
    });
  };

  const isOptionSelected = (groupId, optionId) => {
    return (selectedOptions[groupId] || []).includes(String(optionId));
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      navigate("/compte");
      return;
    }
    const next = !wishlisted;
    setWishlisted(next);
    try {
      if (next) {
        await addToWishlist(product.id);
      } else {
        await removeFromWishlist(product.id);
      }
    } catch {
      setWishlisted(!next);
    }
  };

  const copyLinkToClipboard = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      window.setTimeout(() => setShared(false), 2000);
    } catch {
      // API presse-papiers indisponible (navigateur ancien / contexte non sécurisé)
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `Découvrez ${product.name} sur ANIFOWOCHE`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err?.name !== "AbortError") await copyLinkToClipboard(shareData.url);
      }
      return;
    }
    await copyLinkToClipboard(shareData.url);
  };

  const isFabric = product.unit === "metre";
  const unit = isFabric ? "mètre" : null;
  const badge = isFabric ? "Meilleure vente" : product.category?.name;

  const galleryImages = [
    ...(product.image ? [{ id: "cover", image: product.image, color_name: "" }] : []),
    ...(product.images ?? []),
  ];

  const filteredGalleryImages = selectedColor
    ? galleryImages.filter((img) => !img.color_name || img.color_name === selectedColor)
    : galleryImages;

  const displayImages = filteredGalleryImages.length > 0 ? filteredGalleryImages : galleryImages;
  const hasGallery = displayImages.length > 1;
  const currentImage = displayImages[activeImageIndex] ?? displayImages[0];

  const showPreviousImage = () => {
    setActiveImageIndex((index) => (index - 1 + displayImages.length) % displayImages.length);
  };
  const showNextImage = () => {
    setActiveImageIndex((index) => (index + 1) % displayImages.length);
  };

  const selectedColorData = selectedColor
    ? product.colors?.find((c) => c.name === selectedColor)
    : null;
  const madeToOrder = Boolean(product.made_to_order);
  const stock = selectedColorData ? (selectedColorData.stock ?? 0) : (product.stock ?? 0);
  const inStock = madeToOrder || (product.in_stock ?? stock > 0);
  const outOfStock = !inStock;
  const lowStock = !madeToOrder && !outOfStock && stock <= 5;
  const stockLabel = outOfStock
    ? "Rupture de stock"
    : madeToOrder
      ? "Sur commande — fait maison"
      : lowStock
        ? `Plus que ${stock} en stock`
        : "En stock";
  const stockColorClass = outOfStock ? "text-red-700" : madeToOrder ? "text-brand" : lowStock ? "text-amber-700" : "text-green-700";

  const productDescription =
    product.description?.trim() || `${product.name} — ${badge ?? "ANIFOWOCHE"}, livraison à Cotonou.`;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: productDescription,
    image: product.image ? [optimizedImage(product.image, 800)] : undefined,
    sku: String(product.id),
    category: product.category?.name,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/produits/${slug}`),
      priceCurrency: "XOF",
      price: product.price_xof,
      availability: outOfStock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
    },
  };

  return (
    <article className="mx-auto max-w-7xl px-4 py-6 pb-28 lg:pb-10">
      <Seo
        title={product.name}
        description={productDescription}
        path={`/produits/${slug}`}
        image={product.image ? optimizedImage(product.image, 800) : undefined}
        type="product"
        jsonLd={productJsonLd}
      />
      <div className="mb-5 flex items-center gap-2 text-xs text-muted">
        <button type="button" onClick={() => navigate("/catalogue")} className="transition hover:text-brand-dark">
          Catalogue
        </button>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
        </svg>
        {product.category?.name && (
          <>
            <span>{product.category.name}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
            </svg>
          </>
        )}
        <span className="max-w-52 truncate text-ink">{product.name}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr_340px] lg:gap-8">
        <div className="flex gap-3">
          <div className="hidden flex-col gap-2 sm:flex">
            <button
              type="button"
              className="h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 border-brand bg-brand-pale"
              aria-label="Image produit sélectionnée"
            >
              {currentImage ? (
                <ProductImage src={currentImage.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-brand-dark">
                  ANI
                </span>
              )}
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-brand-pale">
              {currentImage ? (
                <ProductImage src={currentImage.image} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-bold text-brand-dark">
                  ANIFOWOCHE
                </div>
              )}
              {hasGallery && (
                <>
                  <button
                    type="button"
                    onClick={showPreviousImage}
                    className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow transition hover:bg-white"
                    aria-label="Image précédente"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={showNextImage}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow transition hover:bg-white"
                    aria-label="Image suivante"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            {hasGallery && (
              <div className="mt-2 flex justify-center gap-1.5 sm:hidden">
                {displayImages.map((img, index) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    aria-label={`Aller à l'image ${index + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      index === activeImageIndex ? "w-4 bg-brand" : "w-2 bg-black/20"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          {badge && (
            <span className="mb-2 w-fit rounded-full border border-brand/30 bg-brand-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-dark">
              {badge}
            </span>
          )}
          <h1 className="text-xl font-bold leading-snug text-ink md:text-3xl lg:text-2xl">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-b border-black/10 pb-4">
            {product.review_count > 0 ? (
              <>
                <span className="text-sm tracking-[1px] text-brand" aria-hidden="true">
                  ★
                </span>
                <span className="text-sm font-semibold text-brand-dark">
                  {Number(product.rating_average).toFixed(1)}
                </span>
                <span className="text-sm text-muted">{product.review_count} avis</span>
              </>
            ) : (
              <span className="text-sm text-muted">Aucun avis pour le moment</span>
            )}
          </div>

          {product.seller_name && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-2a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v2" />
              </svg>
              Vendu par <span className="font-medium text-ink">{product.seller_name}</span>
            </div>
          )}

          <div className="mt-5">
            <div className="flex flex-wrap items-baseline gap-3">
              {product.discount_percent > 0 ? (
                <>
                  <p className="text-3xl font-bold text-red-600">{formatXof(product.discounted_price_xof)}</p>
                  <p className="text-lg text-muted line-through">{formatXof(product.price_xof)}</p>
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                    -{product.discount_percent}%
                  </span>
                </>
              ) : (
                <p className="text-3xl font-bold text-ink">{formatXof(product.price_xof)}</p>
              )}
              {unit && <span className="text-sm text-muted">/ {unit}</span>}
            </div>
            {product.size && product.size !== "UNIQUE" && (
              <p className="mt-2 text-sm text-ink">
                Taille : <span className="font-semibold">{product.size}</span>
              </p>
            )}
            {product.colors && product.colors.length > 0 && (
              <div className="mt-3">
                <p className="mb-2 text-sm font-semibold text-ink">
                  Couleur{selectedColor ? ` : ${selectedColor}` : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => {
                    const colorStock = color.stock ?? 0;
                    const isSelected = selectedColor === color.name;
                    const isOutOfStock = colorStock <= 0;
                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setSelectedColor(isSelected ? null : color.name)}
                        disabled={isOutOfStock}
                        title={`${color.name}${isOutOfStock ? " (rupture)" : ` — ${colorStock} en stock`}`}
                        className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition ${
                          isSelected
                            ? "border-brand bg-brand-light text-brand-dark"
                            : "border-black/10 bg-white text-ink hover:border-black/25"
                        } ${isOutOfStock ? "cursor-not-allowed opacity-40" : ""}`}
                      >
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10"
                          style={{ backgroundColor: color.hex }}
                        />
                        {color.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {product.option_groups && product.option_groups.length > 0 && (
              <div className="mt-5 space-y-4">
                {product.option_groups.map((group) => (
                  <div key={group.id}>
                    <p className="mb-2 text-sm font-semibold text-ink">
                      {group.name}
                      {group.is_required && (
                        <span className="ml-1.5 text-[10px] font-normal text-red-500">Obligatoire</span>
                      )}
                      {group.max_selections > 1 && (
                        <span className="ml-1.5 text-[10px] font-normal text-muted">
                          ({group.min_selections || 0}-{group.max_selections || "∞"} choix)
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((opt) => {
                        const selected = isOptionSelected(group.id, opt.id);
                        const isRadio = group.max_selections === 1;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleOptionToggle(group.id, opt.id, group.max_selections)}
                            className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition ${
                              selected
                                ? "border-brand bg-brand-light text-brand-dark"
                                : "border-black/10 bg-white text-ink hover:border-black/25"
                            }`}
                          >
                            {isRadio ? (
                              <span
                                className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${
                                  selected ? "border-brand" : "border-black/20"
                                }`}
                              >
                                {selected && <span className="h-2 w-2 rounded-full bg-brand" />}
                              </span>
                            ) : (
                              <span
                                className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${
                                  selected ? "border-brand bg-brand" : "border-black/20"
                                }`}
                              >
                                {selected && (
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
                                  </svg>
                                )}
                              </span>
                            )}
                            {opt.name}
                            {opt.price_xof > 0 && (
                              <span className="text-muted">+{formatXof(opt.price_xof)}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {unit && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold text-ink">Quantité ({unit}s)</p>
              <QuantityStepper
                quantity={quantity}
                onChange={setQuantity}
                max={madeToOrder ? Infinity : stock}
                className="w-full justify-between sm:w-auto sm:justify-start"
              />
            </div>
          )}

          <div className="mt-5 rounded-[10px] bg-[#fafaf8] p-4">
            <p className="text-sm font-semibold text-ink">Description</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
              {product.description || "Description"}
            </p>
          </div>

          {!unit && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold text-ink">Quantité</p>
              <QuantityStepper quantity={quantity} onChange={setQuantity} max={madeToOrder ? Infinity : stock} />
            </div>
          )}

          <div className="mt-auto hidden gap-3 pt-6 lg:flex">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="min-w-0 flex-1 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-medium active:bg-brand-dark disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300"
            >
              {outOfStock ? "Rupture de stock" : added ? "✓ Ajouté au panier !" : "Ajouter au panier"}
            </button>
            <button
              type="button"
              onClick={handleToggleWishlist}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-black/20 text-muted transition hover:border-brand hover:text-brand-dark"
              aria-label={wishlisted ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-black/20 text-muted transition hover:border-brand hover:text-brand-dark"
              aria-label={shared ? "Lien copié" : "Partager le produit"}
            >
              {shared ? (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
                </svg>
              ) : (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <path strokeLinecap="round" d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            {product.discount_percent > 0 ? (
              <div className="flex flex-wrap items-baseline gap-2">
                <p className="text-2xl font-bold text-red-600">{formatXof(product.discounted_price_xof)}</p>
                <p className="text-sm text-muted line-through">{formatXof(product.price_xof)}</p>
                <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  -{product.discount_percent}%
                </span>
              </div>
            ) : (
              <p className="text-2xl font-bold text-ink">{formatXof(product.price_xof)}</p>
            )}
            {unit && <p className="mt-1 text-sm text-muted">par {unit}</p>}
            {product.colors && product.colors.length > 0 && (
              <div className="mt-3">
                <p className="mb-1.5 text-xs font-semibold text-ink">Couleur</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.colors.map((color) => {
                    const isSelected = selectedColor === color.name;
                    const isOutOfStock = (color.stock ?? 0) <= 0;
                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setSelectedColor(isSelected ? null : color.name)}
                        disabled={isOutOfStock}
                        title={`${color.name}${isOutOfStock ? " (rupture)" : ""}`}
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold transition ${
                          isSelected
                            ? "border-brand bg-brand-light text-brand-dark"
                            : "border-black/10 bg-white text-ink hover:border-black/25"
                        } ${isOutOfStock ? "cursor-not-allowed opacity-40" : ""}`}
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/10"
                          style={{ backgroundColor: color.hex }}
                        />
                        {color.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {product.option_groups && product.option_groups.length > 0 && (
              <div className="mt-4 space-y-3">
                {product.option_groups.map((group) => (
                  <div key={group.id}>
                    <p className="mb-1.5 text-xs font-semibold text-ink">
                      {group.name}
                      {group.is_required && <span className="ml-1 text-[10px] text-red-500">*</span>}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.options.map((opt) => {
                        const selected = isOptionSelected(group.id, opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleOptionToggle(group.id, opt.id, group.max_selections)}
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold transition ${
                              selected
                                ? "border-brand bg-brand-light text-brand-dark"
                                : "border-black/10 bg-white text-ink hover:border-black/25"
                            }`}
                          >
                            {opt.name}
                            {opt.price_xof > 0 && <span className="text-muted">+{formatXof(opt.price_xof)}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 space-y-2 text-sm">
              <div className={`flex items-center gap-2 font-medium ${stockColorClass}`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  {outOfStock ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
                  )}
                </svg>
                {stockLabel}
              </div>
              <div className="flex items-center gap-2 text-muted">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v10H3zM14 11h4l3 3v3h-7z" />
                  <circle cx="7" cy="19" r="1.5" />
                  <circle cx="18" cy="19" r="1.5" />
                </svg>
                Livraison Cotonou : 24-48h
              </div>
            </div>
            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold">Quantité</p>
              <QuantityStepper quantity={quantity} onChange={setQuantity} max={madeToOrder ? Infinity : stock} className="w-full justify-between" />
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="mt-5 w-full rounded-lg bg-brand px-6 py-3.5 font-semibold text-white transition hover:bg-brand-medium active:bg-brand-dark disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300"
            >
              {outOfStock ? "Rupture de stock" : added ? "✓ Ajouté !" : "Ajouter au panier"}
            </button>
            <div className="mt-4 space-y-2 border-t border-black/10 pt-4 text-xs text-muted">
              <div className="flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                </svg>
                Paiement sécurisé garanti
              </div>
              <div className="flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand">
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
                </svg>
                Confirmation par SMS sous 1h
              </div>
            </div>
          </div>
        </aside>
      </div>

      <ReviewsSection productId={product.id} productSlug={slug} />

      <div className="fixed inset-x-0 bottom-[calc(var(--tabbar-h)+var(--tabbar-safe))] z-20 flex gap-3 border-t border-black/10 bg-white p-4 md:bottom-0 lg:hidden">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={outOfStock}
          className="min-w-0 flex-1 rounded-lg bg-brand px-6 py-3.5 font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {outOfStock ? "Rupture de stock" : added ? "✓ Ajouté !" : "Ajouter au panier"}
        </button>
        <button
          type="button"
          onClick={handleToggleWishlist}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-black/20 text-muted"
          aria-label={wishlisted ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
          </svg>
        </button>
      </div>
    </article>
  );
}

const emptyReviewForm = { author_name: "", rating: 5, comment: "" };

function ReviewsSection({ productId, productSlug }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyReviewForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchProductReviews(productSlug)
      .then((data) => setReviews(data.results ?? data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productSlug]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createReview({ product_id: productId, ...form });
      setForm(emptyReviewForm);
      setSubmitted(true);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-10 border-t border-black/10 pt-8">
      <h2 className="text-lg font-bold text-ink">Avis clients</h2>

      {!loading && reviews.length === 0 && (
        <p className="mt-3 text-sm text-muted">Aucun avis pour le moment. Soyez le premier à donner votre avis.</p>
      )}

      {reviews.length > 0 && (
        <ul className="mt-4 space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-lg border border-black/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">{review.author_name}</p>
                <span className="shrink-0 text-sm tracking-[1px] text-brand" aria-hidden="true">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </span>
              </div>
              {review.comment && <p className="mt-2 text-sm text-muted">{review.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="mt-6 max-w-md rounded-[10px] bg-[#fafaf8] p-4">
        <p className="text-sm font-semibold text-ink">Laisser un avis</p>
        {submitted && <p className="mt-2 text-sm text-green-700">Merci ! Votre avis sera visible après validation.</p>}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-3 flex flex-col gap-3">
          <input
            type="text"
            placeholder="Votre nom"
            required
            value={form.author_name}
            onChange={(e) => setForm({ ...form, author_name: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {"★".repeat(value)} ({value}/5)
              </option>
            ))}
          </select>
          <textarea
            placeholder="Votre commentaire (optionnel)"
            rows={3}
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-fit rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? "Envoi…" : "Envoyer mon avis"}
          </button>
        </div>
      </form>
    </section>
  );
}
