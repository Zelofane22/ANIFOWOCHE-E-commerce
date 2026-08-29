import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useStoreStatus } from "../context/useStoreStatus.js";
import { fetchProductBySlug } from "../api/products.js";
import { addToWishlist, fetchWishlistStatus, removeFromWishlist } from "../api/wishlist.js";
import Seo from "../components/Seo.jsx";
import { useAuth } from "../context/useAuth.js";
import { useCart } from "../context/useCart.js";
import { optimizedImage } from "../utils/imageUrl.js";
import { absoluteUrl } from "../utils/siteUrl.js";
import ProductGallery from "../components/product/ProductGallery.jsx";
import ProductInfo from "../components/product/ProductInfo.jsx";
import ProductActions from "../components/product/ProductActions.jsx";
import ProductReviews from "../components/product/ProductReviews.jsx";

export default function Product() {
  const { slug } = useParams();
  return <ProductView key={slug} slug={slug} />;
}

function ProductView({ slug }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { maintenanceMode } = useStoreStatus();
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
  const [optionErrors, setOptionErrors] = useState({});

  const loadProduct = useCallback(() => {
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
    loadProduct();
  }, [loadProduct]);

  const handleRetry = () => {
    setError(null);
    setNotFound(false);
    setProduct(null);
    loadProduct();
  };

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
  if (error)
    return (
      <div role="alert" className="px-4 py-16 text-center">
        <p className="font-semibold text-red-600">Impossible de charger ce produit pour le moment.</p>
        <p className="mt-2 text-sm text-muted">Vérifiez votre connexion puis réessayez.</p>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-6 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-medium"
        >
          Réessayer
        </button>
      </div>
    );
  if (!product) return <p className="px-4 py-16 text-center text-muted">Chargement…</p>;

  const productInStock = product.in_stock ?? (Boolean(product.made_to_order) || (product.stock ?? 0) > 0);
  const isRestaurantProduct = Boolean(product.made_to_order);

  const handleAddToCart = () => {
    if (maintenanceMode) return false;
    if (!productInStock) return false;

    const nextErrors = {};
    for (const group of product.option_groups ?? []) {
      const selectedCount = (selectedOptions[group.id] ?? []).length;
      const minimum = !isRestaurantProduct && group.is_required ? Math.max(1, group.min_selections ?? 1) : 0;
      if (selectedCount < minimum) {
        nextErrors[group.id] = "Sélectionnez au moins " + minimum + " option" + (minimum > 1 ? "s" : "") + ".";
      }
    }
    setOptionErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return false;

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
    return true;
  };

  const handleBuyNow = () => {
    if (maintenanceMode) return;
    if (handleAddToCart()) navigate("/commande");
  };

  const handleOptionToggle = (groupId, optionId, maxSelections) => {
    setOptionErrors((current) => {
      if (!current[groupId]) return current;
      const next = { ...current };
      delete next[groupId];
      return next;
    });
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

  const galleryImages = {
    cover: product.image,
    gallery: product.images ?? [],
  };

  const selectedColorData = selectedColor
    ? product.colors?.find((c) => c.name === selectedColor)
    : null;
  const madeToOrder = Boolean(product.made_to_order);
  const stock = selectedColorData ? (selectedColorData.stock ?? 0) : (product.stock ?? 0);
  const inStock = madeToOrder || (product.in_stock ?? stock > 0);
  const outOfStock = !inStock;
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

  const seoTitle = product.category?.name
    ? `${product.name} — ${product.category.name}`
    : product.name;

  return (
    <article className="mx-auto max-w-7xl px-4 py-6 pb-28 lg:pb-10">
      {maintenanceMode && (
        <div role="alert" className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0 text-amber-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.3 3.3 10.3a2 2 0 0 0 0 2.8l7 7a2 2 0 0 0 2.8 0l7-7a2 2 0 0 0 0-2.8l-7-7a2 2 0 0 0-2.8 0Z" />
          </svg>
          <span>Boutique en maintenance — les commandes sont temporairement suspendues. Vous pouvez naviguer mais pas ajouter au panier.</span>
        </div>
      )}
      <Seo
        title={seoTitle}
        description={productDescription}
        path={`/produits/${slug}`}
        image={product.image ? optimizedImage(product.image, 800) : undefined}
        type="product"
        jsonLd={productJsonLd}
        breadcrumbs={[
          { name: "Accueil", path: "/" },
          { name: "Catalogue", path: "/catalogue" },
          ...(product.category?.name ? [{ name: product.category.name, path: "/catalogue" }] : []),
          { name: product.name },
        ]}
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
        <div>
          <ProductGallery
            images={galleryImages}
            selectedColor={selectedColor}
            activeImageIndex={activeImageIndex}
            onImageChange={setActiveImageIndex}
          />
        </div>

        <div className="flex flex-col">
          <ProductInfo product={product} badge={badge} selectedColor={selectedColor} optionErrors={optionErrors} onColorChange={setSelectedColor} onOptionToggle={handleOptionToggle} isOptionSelected={isOptionSelected} quantity={quantity} setQuantity={setQuantity} unit={unit} isRestaurantProduct={isRestaurantProduct} />

          <ProductActions
            handleBuyNow={handleBuyNow}
            handleAddToCart={handleAddToCart}
            handleToggleWishlist={handleToggleWishlist}
            handleShare={handleShare}
            wishlisted={wishlisted}
            added={added}
            shared={shared}
            outOfStock={outOfStock}
            maintenanceMode={maintenanceMode}
            isMobile={false}
          />
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <ProductInfo product={product} badge={badge} selectedColor={selectedColor} optionErrors={optionErrors} onColorChange={setSelectedColor} onOptionToggle={handleOptionToggle} isOptionSelected={isOptionSelected} quantity={quantity} setQuantity={setQuantity} unit={unit} isRestaurantProduct={isRestaurantProduct} />

            <ProductActions
              handleBuyNow={handleBuyNow}
              handleAddToCart={handleAddToCart}
              handleToggleWishlist={handleToggleWishlist}
              handleShare={handleShare}
              wishlisted={wishlisted}
              added={added}
              shared={shared}
              outOfStock={outOfStock}
              maintenanceMode={maintenanceMode}
              isMobile={false}
            />
          </div>
        </aside>
      </div>

      <ProductReviews productId={product.id} productSlug={slug} />

      <ProductActions
        handleBuyNow={handleBuyNow}
        handleAddToCart={handleAddToCart}
        handleToggleWishlist={handleToggleWishlist}
        handleShare={handleShare}
        wishlisted={wishlisted}
        added={added}
        shared={shared}
        outOfStock={outOfStock}
        maintenanceMode={maintenanceMode}
        isMobile={true}
      />
    </article>
  );
}
