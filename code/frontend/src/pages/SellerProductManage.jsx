import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  getSellerProducts,
  getSellerProfile,
  archiveSellerProduct,
} from "../api/seller.js";
import {
  ChevronLeftIcon,
  EditIcon,
  EyeOffIcon,
  ImageIcon,
  MoreHorizontalIcon,
  TrashIcon,
} from "../components/icons.jsx";
import SellerShell from "../components/seller/SellerShell.jsx";
import { useAuth } from "../context/useAuth.js";
import { formatXof } from "../utils/format.js";
import ProductImage from "../components/ProductImage.jsx";

function StatusBadge({ product, light }) {
  if (!product.is_active) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${light ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}
      >
        Archivé
      </span>
    );
  }
  if (product.made_to_order) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${light ? "bg-white/20 text-white" : "bg-blue-100 text-blue-600"}`}
      >
        Sur commande
      </span>
    );
  }
  if ((product.stock ?? 0) <= 0) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${light ? "bg-white/20 text-white" : "bg-red-100 text-red-600"}`}
      >
        Rupture
      </span>
    );
  }
  if ((product.stock ?? 0) <= 5) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${light ? "bg-white/20 text-white" : "bg-amber-100 text-amber-600"}`}
      >
        Stock faible
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${light ? "bg-white/20 text-white" : "bg-green-100 text-green-600"}`}
    >
      Publié
    </span>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-[16px] shadow-sm border border-black/[0.05] p-4 text-center">
      <p className="text-xs text-[#9CA3AF] font-medium mb-1">{label}</p>
      <p className="text-base font-bold text-[#111827]">{value}</p>
    </div>
  );
}

function PerfRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-black/[0.06] last:border-b-0">
      <span className="text-sm text-[#6B7280]">{label}</span>
      <span className="text-sm font-semibold text-[#111827]">{value}</span>
    </div>
  );
}
export default function SellerProductManage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useAuth();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    Promise.all([getSellerProfile(), getSellerProducts()])
      .then(([sellerData, productData]) => {
        setSeller(sellerData);
        setProducts(productData.results ?? productData);
        setReady(true);
      })
      .catch((err) => {
        navigate(err?.response?.status === 404 ? "/register" : "/login", {
          replace: true,
        });
      });
  }, [isAuthenticated, loading, navigate]);

  const product = useMemo(
    () => products.find((p) => p.slug === slug) ?? null,
    [products, slug]
  );

  const performance = useMemo(() => {
    if (!product) return null;
    return {
      views: product.views_count ?? product.views ?? 0,
      orders: product.orders_count ?? product.order_count ?? 0,
      revenue: product.revenue_xof ?? 0,
      conversion:
        product.conversion_rate != null
          ? `${(product.conversion_rate * 100).toFixed(1)}%`
          : "—",
      favorites: product.favorites_count ?? product.wishlist_count ?? 0,
    };
  }, [product]);

  const handleArchive = async () => {
    if (!product || archiving) return;
    setArchiving(true);
    try {
      await archiveSellerProduct(product.slug);
      setProducts((prev) =>
        prev.map((p) =>
          p.slug === product.slug ? { ...p, is_active: false } : p
        )
      );
      setMenuOpen(false);
    } catch (err) {
      console.error("Erreur lors de l’archivage", err);
    } finally {
      setArchiving(false);
    }
  };

  if (loading || !seller || !ready) {
    return (
      <div className="min-h-screen bg-[#F4F4F8] px-4 py-10 text-center text-[#6B7280]">
        Chargement...
      </div>
    );
  }

  if (!product) {
    return (
      <SellerShell seller={seller} pendingCount={0}>
        <section className="px-4 pt-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F3F4F6]">
            <ImageIcon size={28} className="text-[#9CA3AF]" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-[#111827]">
            Produit introuvable
          </h2>
          <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-[#6B7280]">
            Ce produit n’existe plus ou n’est pas dans votre catalogue.
          </p>
          <Link
            to="/products"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#C99F08] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#A67C06]"
          >
            Retour au catalogue
          </Link>
        </section>
      </SellerShell>
    );
  }

  return (
    <SellerShell seller={seller} pendingCount={0}>
      {/* Hero image area */}
      <div className="relative h-72 w-full bg-[#F3F4F6] overflow-hidden">
        {product.image ? (
          <ProductImage
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon size={48} className="text-[#D1D5DB]" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Back button */}
        <Link
          to="/products"
          className="absolute top-4 left-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-[#374151] shadow-sm transition hover:bg-white"
        >
          <ChevronLeftIcon size={18} />
        </Link>

        {/* More menu button */}
        <div className="absolute top-4 right-4">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-[#374151] shadow-sm transition hover:bg-white"
          >
            <MoreHorizontalIcon size={16} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 z-20 min-w-[160px] rounded-[12px] border border-black/10 bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate(`/products/${product.slug}/edit`);
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[#374151] hover:bg-gray-50"
              >
                <EditIcon size={14} />
                Modifier
              </button>
              {product.is_active && (
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={archiving}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <TrashIcon size={14} />
                  {archiving ? "Archivage..." : "Archiver"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Status badge */}
        <div className="absolute bottom-3 left-4">
          <StatusBadge product={product} light />
        </div>
      </div>

      {/* Close menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Content area */}
      <div className="px-4 pt-5 pb-24 space-y-4">
        {/* Product name + category */}
        <div>
          <h1 className="text-xl font-bold text-[#111827]">{product.name}</h1>
          {(product.category?.name || product.category_path) && (
            <p className="mt-1 text-sm text-[#9CA3AF]">
              {product.category_path || product.category.name}
            </p>
          )}
        </div>

        {/* 3-column stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Prix" value={formatXof(product.price_xof)} />
          <StatCard
            label="Stock"
            value={product.made_to_order ? "Sur com." : (product.stock ?? 0)}
          />
          <StatCard
            label="Ventes"
            value={product.orders_count ?? product.order_count ?? 0}
          />
        </div>

        {/* Description card */}
        {product.description && (
          <div className="bg-white rounded-[16px] shadow-sm border border-black/[0.05] p-4">
            <h3 className="text-sm font-bold text-[#111827] mb-2">Description</h3>
            <p className="text-sm leading-6 text-[#6B7280] whitespace-pre-line">
              {product.description}
            </p>
          </div>
        )}

        {/* Performance card (7 jours) */}
        {performance && (
          <div className="bg-white rounded-[16px] shadow-sm border border-black/[0.05] p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-[#111827]">Performance</h3>
              <span className="text-[10px] font-semibold text-[#9CA3AF] bg-[#F3F4F6] px-2 py-0.5 rounded-full">
                7 jours
              </span>
            </div>
            <div className="mt-2">
              <PerfRow label="Vues" value={performance.views} />
              <PerfRow label="Commandes" value={performance.orders} />
              <PerfRow label="Revenu" value={formatXof(performance.revenue)} />
              <PerfRow label="Taux de conversion" value={performance.conversion} />
              <PerfRow label="Favoris" value={performance.favorites} />
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom action bar */}
      <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-black/[0.06] bg-white px-4 py-3 lg:static lg:border-t-0 lg:bg-transparent lg:px-0 lg:pt-0 lg:pb-0">
        <div className="mx-auto max-w-6xl flex gap-3">
          {product.is_active ? (
            <button
              type="button"
              onClick={handleArchive}
              disabled={archiving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
            >
              <EyeOffIcon size={16} />
              {archiving ? "Archivage..." : "Désactiver"}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-[10px] border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-400 disabled:cursor-not-allowed"
            >
              <EyeOffIcon size={16} />
              Désactivé
            </button>
          )}
          <Link
            to={`/products/${product.slug}/edit`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#C99F08] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#A67C06] active:bg-[#8B6604]"
          >
            <EditIcon size={16} />
            Modifier
          </Link>
        </div>
      </div>
    </SellerShell>
  );
}
