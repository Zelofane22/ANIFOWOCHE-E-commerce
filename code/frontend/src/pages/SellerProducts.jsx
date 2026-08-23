import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { archiveSellerProduct, getSellerProducts, getSellerProfile } from "../api/seller.js";
import { ImageIcon, PackageIcon, PlusIcon, SearchIcon, EyeIcon, TrashIcon, MoreHorizontalIcon } from "../components/icons.jsx";
import SellerShell from "../components/seller/SellerShell.jsx";
import { useAuth } from "../context/useAuth.js";
import { extractErrorMessage } from "../utils/apiError.js";
import { formatXof } from "../utils/format.js";
import ProductImage from "../components/ProductImage.jsx";

const FILTERS = [
  { key: "all", label: "Tous" },
  { key: "active", label: "Actifs" },
  { key: "low_stock", label: "Stock faible" },
  { key: "out_of_stock", label: "Rupture" },
  { key: "archived", label: "Archivés" },
];

function productMatchesFilter(product, filter) {
  if (filter === "all") return true;
  if (filter === "archived") return !product.is_active;
  if (filter === "active") return product.is_active;
  if (filter === "out_of_stock") return product.is_active && (product.stock ?? 0) <= 0 && !product.made_to_order;
  if (filter === "low_stock") return product.is_active && (product.stock ?? 0) > 0 && (product.stock ?? 0) <= 5 && !product.made_to_order;
  return true;
}

function StatusBadge({ product }) {
  if (!product.is_active) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
        Archivé
      </span>
    );
  }
  if (product.made_to_order) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
        Sur commande
      </span>
    );
  }
  if ((product.stock ?? 0) <= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
        Rupture
      </span>
    );
  }
  if ((product.stock ?? 0) <= 5) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
        Stock faible
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-600">
      Publié
    </span>
  );
}

export default function SellerProducts() {
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useAuth();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [menuOpen, setMenuOpen] = useState(null);

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
      })
      .catch((err) => {
        navigate(err?.response?.status === 404 ? "/register" : "/login", { replace: true });
      });
  }, [isAuthenticated, loading, navigate]);

  const productLimit = seller?.limits?.max_products ?? null;
  const activeCount = useMemo(() => products.filter((p) => p.is_active).length, [products]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || (p.category?.name ?? "").toLowerCase().includes(q);
      const matchesFilter = productMatchesFilter(p, filter);
      return matchesSearch && matchesFilter;
    });
  }, [products, search, filter]);

  const handleArchive = async (product) => {
    try {
      await archiveSellerProduct(product.slug);
      setProducts((current) =>
        current.map((item) => (item.slug === product.slug ? { ...item, is_active: false } : item))
      );
    } catch (err) {
      console.error(extractErrorMessage(err));
    }
    setMenuOpen(null);
  };

  if (loading || !seller) {
    return (
      <div className="min-h-screen bg-[#F4F4F8] px-4 py-10 text-center text-[#6B7280]">
        Chargement...
      </div>
    );
  }

  return (
    <SellerShell seller={seller} pendingCount={0}>
      {/* Sticky header */}
      <div className="bg-white px-5 pt-12 pb-4 border-b border-black/5 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#111827]">Produits</h1>
            <p className="text-xs text-[#9CA3AF] font-medium mt-0.5">
              {activeCount}{productLimit != null ? ` / ${productLimit}` : ""} publié{activeCount > 1 ? "s" : ""}
            </p>
          </div>
          <Link
            to="/products/new"
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#C99F08] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#A67C06] active:bg-[#8B6604]"
          >
            <PlusIcon size={15} />
            Ajouter
          </Link>
        </div>

        {/* Search bar */}
        <div className="relative">
          <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-[12px] bg-[#F3F4F6] pl-10 pr-4 py-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] border border-transparent focus:border-[#C99F08] focus:ring-2 focus:ring-[#C99F08]/15 focus:bg-white focus:outline-none transition-all"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                filter === f.key
                  ? "bg-[#C99F08] text-white"
                  : "bg-white text-[#6B7280] border border-black/10 hover:border-[#C99F08]/50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="px-4 pt-4 pb-24">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mx-auto">
              <PackageIcon size={28} className="text-[#9CA3AF]" />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#111827]">
              {products.length === 0 ? "Aucun produit" : "Aucun résultat"}
            </h3>
            <p className="mx-auto mt-1 max-w-xs text-sm text-[#6B7280] leading-relaxed">
              {products.length === 0
                ? "Ajoutez votre premier produit pour commencer à vendre."
                : "Essayez une autre recherche ou filtre."}
            </p>
            {products.length === 0 && (
              <Link
                to="/products/new"
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#C99F08] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#A67C06]"
              >
                <PlusIcon size={15} />
                Ajouter un produit
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-[16px] shadow-sm border border-black/[0.05] overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
                onClick={() => navigate(`/products/${product.slug}`)}
              >
                {/* Image */}
                <div className="aspect-square relative bg-[#F3F4F6]">
                  {product.image ? (
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={32} className="text-[#D1D5DB]" />
                    </div>
                  )}
                  {!product.is_active && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-xs font-bold bg-gray-500 px-2 py-1 rounded-full">
                        Archivé
                      </span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === product.id ? null : product.id);
                      }}
                      className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
                    >
                      <MoreHorizontalIcon size={13} className="text-[#374151]" />
                    </button>
                    {menuOpen === product.id && (
                      <div className="absolute right-0 top-8 z-20 bg-white rounded-[12px] shadow-lg border border-black/10 py-1 min-w-[140px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/products/${product.slug}`);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-[#374151] hover:bg-gray-50 flex items-center gap-2"
                        >
                          <EyeIcon size={14} />
                          Voir
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/products/${product.slug}/edit`);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-[#374151] hover:bg-gray-50 flex items-center gap-2"
                        >
                          Modifier
                        </button>
                        {product.is_active && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchive(product);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <TrashIcon size={14} />
                            Archiver
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="font-semibold text-[#111827] text-sm leading-snug line-clamp-2 mb-1.5">
                    {product.name}
                  </p>
                  <p className="font-bold text-[#111827] text-base mb-2">
                    {formatXof(product.price_xof)}
                  </p>
                  <div className="flex items-center justify-between">
                    <StatusBadge product={product} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Close menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
      )}

      {/* FAB */}
      <Link
        to="/products/new"
        className="fixed bottom-20 right-5 z-30 w-14 h-14 rounded-full bg-[#C99F08] text-white flex items-center justify-center shadow-lg shadow-[#C99F08]/30 hover:bg-[#A67C06] transition-colors lg:hidden"
        style={{ bottom: "calc(var(--tabbar-h) + var(--tabbar-safe) + 1.5rem)" }}
      >
        <PlusIcon size={24} />
      </Link>
    </SellerShell>
  );
}
