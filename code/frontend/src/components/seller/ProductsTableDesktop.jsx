import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  ChevronDownIcon,
  EditIcon,
  EyeIcon,
  ImageIcon,
  PackageIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "../icons.jsx";
import ProductImage from "../ProductImage.jsx";
import { formatXof } from "../../utils/format.js";

const SORTS = [
  ["recent", "Plus récents"],
  ["name", "Nom (A → Z)"],
  ["price_desc", "Prix décroissant"],
  ["price_asc", "Prix croissant"],
  ["stock_asc", "Stock le plus bas"],
];

const sorters = {
  recent: (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
  name: (a, b) => a.name.localeCompare(b.name, "fr"),
  price_desc: (a, b) => (b.price_xof ?? 0) - (a.price_xof ?? 0),
  price_asc: (a, b) => (a.price_xof ?? 0) - (b.price_xof ?? 0),
  stock_asc: (a, b) =>
    (a.made_to_order ? Infinity : a.stock ?? 0) - (b.made_to_order ? Infinity : b.stock ?? 0),
};

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—";

function StockCell({ product }) {
  if (product.made_to_order) return <span className="text-[13px] font-medium text-blue-700">Sur commande</span>;
  const stock = product.stock ?? 0;
  const tone = stock <= 0 ? "text-red-700" : stock <= 5 ? "text-amber-700" : "text-ink";
  return (
    <span className={`text-[13px] font-semibold ${tone}`}>
      {stock} <span className="font-medium text-[#9CA3AF]">en stock</span>
    </span>
  );
}

function IconAction({ label, onClick, disabled, danger, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40 ${
        danger ? "text-red-600 hover:bg-red-50" : "text-muted hover:bg-gray-100 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export default function ProductsTableDesktop({
  products,
  totalCount,
  filters,
  counts,
  filter,
  onFilterChange,
  search,
  onSearchChange,
  onArchive,
  maintenanceMode,
  StatusBadge,
}) {
  const navigate = useNavigate();
  const [sort, setSort] = useState("recent");
  const sorted = useMemo(() => [...products].sort(sorters[sort]), [products, sort]);

  return (
    <div className="space-y-5 px-8 pt-7 pb-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-80">
          <SearchIcon size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="search"
            placeholder="Rechercher un produit ou une catégorie…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-[10px] border border-black/[0.08] bg-white py-2.5 pr-4 pl-10 text-sm text-ink placeholder:text-[#9CA3AF] transition focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none"
          />
        </div>

        <div className="flex flex-1 flex-wrap gap-1.5" role="tablist" aria-label="Filtrer les produits">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => onFilterChange(f.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-bold transition ${
                filter === f.key ? "bg-ink text-white" : "bg-white text-muted ring-1 ring-black/[0.08] hover:text-ink"
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-1.5 text-[11px] ${
                  filter === f.key ? "bg-white/20 text-white" : "bg-[#F4F4F8] text-muted"
                }`}
              >
                {counts[f.key] ?? 0}
              </span>
            </button>
          ))}
        </div>

        <label className="relative">
          <span className="sr-only">Trier par</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none rounded-[10px] border border-black/[0.08] bg-white py-2.5 pr-9 pl-3.5 text-[13px] font-semibold text-ink focus:border-brand focus:outline-none"
          >
            {SORTS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDownIcon
            size={16}
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted"
          />
        </label>
      </div>

      <section className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
        {sorted.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F3F4F6]">
              <PackageIcon size={28} className="text-[#9CA3AF]" />
            </div>
            <h3 className="mt-4 text-base font-bold text-ink">{totalCount === 0 ? "Aucun produit" : "Aucun résultat"}</h3>
            <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-muted">
              {totalCount === 0
                ? "Ajoutez votre premier produit pour commencer à vendre."
                : "Essayez une autre recherche ou un autre filtre."}
            </p>
            {totalCount === 0 && !maintenanceMode && (
              <Link
                to="/products/new"
                className="mt-5 inline-flex items-center gap-2 rounded-[10px] bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
              >
                <PlusIcon size={15} />
                Ajouter un produit
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full table-fixed text-left">
            <thead className="bg-[#F4F4F8] text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              <tr>
                <th className="w-[36%] py-3 pl-5 font-bold">Produit</th>
                <th className="w-[14%] py-3 font-bold">Prix</th>
                <th className="w-[13%] py-3 font-bold">Stock</th>
                <th className="w-[13%] py-3 font-bold">Statut</th>
                <th className="w-[12%] py-3 font-bold">Ajouté le</th>
                <th className="py-3 pr-5 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.06]">
              {sorted.map((product) => (
                <tr
                  key={product.id}
                  onClick={() => navigate(`/products/${product.slug}`)}
                  className={`cursor-pointer transition hover:bg-[#FAFAFC] ${product.is_active ? "" : "opacity-60"}`}
                >
                  <td className="py-3 pl-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-[#F3F4F6]">
                        {product.image ? (
                          <ProductImage src={product.image} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon size={20} className="text-[#D1D5DB]" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/products/${product.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="block truncate text-sm font-semibold text-ink hover:text-brand-dark"
                        >
                          {product.name}
                        </Link>
                        {product.category?.name && (
                          <p className="truncate text-xs text-[#9CA3AF]">{product.category.name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    {product.discounted_price_xof ? (
                      <>
                        <p className="text-sm font-bold text-ink">{formatXof(product.discounted_price_xof)}</p>
                        <p className="text-xs text-[#9CA3AF] line-through">{formatXof(product.price_xof)}</p>
                      </>
                    ) : (
                      <p className="text-sm font-bold text-ink">{formatXof(product.price_xof)}</p>
                    )}
                  </td>
                  <td className="py-3">
                    <StockCell product={product} />
                  </td>
                  <td className="py-3">
                    <StatusBadge product={product} />
                  </td>
                  <td className="py-3 text-[13px] text-muted">{formatDate(product.created_at)}</td>
                  <td className="py-3 pr-5">
                    <div className="flex items-center justify-end gap-1">
                      <IconAction label="Voir" onClick={() => navigate(`/products/${product.slug}`)}>
                        <EyeIcon size={16} />
                      </IconAction>
                      <IconAction
                        label="Modifier"
                        disabled={maintenanceMode}
                        onClick={() => navigate(`/products/${product.slug}/edit`)}
                      >
                        <EditIcon size={16} />
                      </IconAction>
                      {product.is_active && (
                        <IconAction
                          label="Archiver"
                          danger
                          disabled={maintenanceMode}
                          onClick={() => onArchive(product)}
                        >
                          <TrashIcon size={16} />
                        </IconAction>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {sorted.length > 0 && (
        <p className="text-xs text-[#9CA3AF]">
          {sorted.length} produit{sorted.length > 1 ? "s" : ""} affiché{sorted.length > 1 ? "s" : ""} sur {totalCount}
        </p>
      )}
    </div>
  );
}
