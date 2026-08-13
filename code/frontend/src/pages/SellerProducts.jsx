import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { fetchCategoryTree } from "../api/products.js";
import { archiveSellerProduct, getSellerProducts, getSellerProfile } from "../api/seller.js";
import { EditIcon, EyeIcon, ImageIcon, PackageIcon, PlusIcon, TrashIcon } from "../components/icons.jsx";
import SellerShell from "../components/seller/SellerShell.jsx";
import { useAuth } from "../context/useAuth.js";
import { extractErrorMessage } from "../utils/apiError.js";
import { formatXof } from "../utils/format.js";
import ProductImage from "../components/ProductImage.jsx";

function ProductStatus({ product }) {
  if (!product.is_active) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">
        <EyeIcon size={13} />
        Archivé
      </span>
    );
  }
  if (product.made_to_order) {
    return <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">Sur commande</span>;
  }
  if ((product.stock ?? 0) <= 0) {
    return <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">Rupture</span>;
  }
  if (product.stock <= 5) {
    return <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">Stock faible</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
      <EyeIcon size={13} />
      Publié
    </span>
  );
}

export default function SellerProducts() {
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useAuth();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    Promise.all([getSellerProfile(), getSellerProducts(), fetchCategoryTree()])
      .then(([sellerData, productData]) => {
        setSeller(sellerData);
        setProducts(productData.results ?? productData);
      })
      .catch((err) => {
        navigate(err?.response?.status === 404 ? "/register" : "/login", { replace: true });
      });
  }, [isAuthenticated, loading, navigate]);

  const activeProducts = useMemo(() => products.filter((product) => product.is_active), [products]);
  const archivedProducts = products.length - activeProducts.length;

  // Limites du plan (null = illimité) exposées par le profil vendeur.
  const productLimit = seller?.limits?.max_products ?? null;

  const handleArchive = async (product) => {
    try {
      await archiveSellerProduct(product.slug);
      setProducts((current) =>
        current.map((item) => (item.slug === product.slug ? { ...item, is_active: false } : item))
      );
    } catch (err) {
      console.error(extractErrorMessage(err));
    }
  };

  if (loading || !seller) {
    return <div className="min-h-screen bg-surface-muted px-4 py-10 text-center text-muted">Chargement...</div>;
  }

  return (
    <SellerShell title="Produits" seller={seller}>
      <section className="rounded-xl border border-black/10 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-black/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Catalogue vendeur</h2>
            <p className="mt-1 text-sm text-muted">
              {activeProducts.length}
              {productLimit != null ? ` / ${productLimit}` : ""} publié{activeProducts.length > 1 ? "s" : ""} ·{" "}
              {archivedProducts} archivé{archivedProducts > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/products/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-medium"
            >
              <PlusIcon size={15} />
              Ajouter
            </Link>
            <Link
              to={seller.shop.public_path}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-black/15 px-4 py-2.5 text-sm font-bold text-ink transition hover:border-brand hover:text-brand-dark"
            >
              <EyeIcon size={15} />
              Voir la boutique
            </Link>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="py-16 text-center">
            <PackageIcon size={36} className="mx-auto text-muted" />
            <h3 className="mt-3 text-base font-bold text-ink">Aucun produit pour l'instant</h3>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">
              Ajoutez vos premiers articles avec un prix, un stock et une catégorie pour rendre la boutique vendable.
            </p>
            <Link
              to="/products/new"
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-medium"
            >
              <PlusIcon size={15} />
              Ajouter un produit
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-black/10">
            {products.map((product) => (
              <article key={product.id} className="grid gap-4 py-4 sm:grid-cols-[82px_1fr_auto] sm:items-center">
                <div className="aspect-square w-20 overflow-hidden rounded-lg bg-brand-pale">
                  {product.image ? (
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-brand-dark">
                      <ImageIcon size={24} />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-ink">{product.name}</h3>
                    <ProductStatus product={product} />
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {product.category?.name ?? "Sans catégorie"} · {formatXof(product.price_xof)} · Stock {product.stock}
                  </p>
                  {product.description && (
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{product.description}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                  <button
                    type="button"
                    onClick={() => navigate(`/products/${product.slug}/edit`)}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-black/15 px-3 py-2 text-sm font-bold text-ink transition hover:border-brand hover:text-brand-dark"
                  >
                    <EditIcon size={15} />
                    Modifier
                  </button>
                  {product.is_active && (
                    <button
                      type="button"
                      onClick={() => handleArchive(product)}
                      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50"
                    >
                      <TrashIcon size={15} />
                      Archiver
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </SellerShell>
  );
}
