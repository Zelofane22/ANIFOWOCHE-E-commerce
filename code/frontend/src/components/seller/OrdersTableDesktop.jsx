import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { CheckIcon, ChevronDownIcon, ChevronRightIcon, PackageIcon, SearchIcon, XIcon } from "../icons.jsx";
import OrderStatusPill from "./OrderStatusPill.jsx";
import { formatXof } from "../../utils/format.js";
import {
  canCancel,
  formatOrderDate,
  initialsOf,
  itemsCount,
  nextStatusAction,
  orderCustomerName,
} from "../../utils/sellerOrders.js";

const SORTS = [
  ["recent", "Plus récentes"],
  ["oldest", "Plus anciennes"],
  ["total_desc", "Montant décroissant"],
  ["total_asc", "Montant croissant"],
];

const totalOf = (order) => order.total_xof ?? order.total ?? 0;

const sorters = {
  recent: (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
  oldest: (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0),
  total_desc: (a, b) => totalOf(b) - totalOf(a),
  total_asc: (a, b) => totalOf(a) - totalOf(b),
};

function RowActions({ order, saving, maintenanceMode, onAdvance, onCancel }) {
  const next = nextStatusAction(order.status);
  const cancellable = canCancel(order.status);
  if (!next && !cancellable) return <span className="text-xs text-[#9CA3AF]">—</span>;
  const disabled = saving || maintenanceMode;
  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };
  return (
    <div className="flex items-center justify-end gap-1.5">
      {next && (
        <button
          type="button"
          disabled={disabled}
          onClick={stop(() => onAdvance(order, next.status))}
          title={maintenanceMode ? "Boutique en maintenance" : undefined}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-ink px-3 py-1.5 text-xs font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CheckIcon size={13} />
          {saving ? "…" : next.label}
        </button>
      )}
      {cancellable && (
        <button
          type="button"
          disabled={disabled}
          onClick={stop(() => onCancel(order))}
          title="Annuler la commande"
          aria-label={`Annuler la commande #${order.id}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <XIcon size={15} />
        </button>
      )}
    </div>
  );
}

export default function OrdersTableDesktop({
  orders,
  totalCount,
  filters,
  counts,
  filter,
  onFilterChange,
  search,
  onSearchChange,
  savingOrderIds = [],
  statusErrors = {},
  maintenanceMode = false,
  onAdvance,
  onCancel,
}) {
  const navigate = useNavigate();
  const [sort, setSort] = useState("recent");
  const sorted = useMemo(() => [...orders].sort(sorters[sort]), [orders, sort]);

  return (
    <div className="space-y-5 px-8 pt-7 pb-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-80">
          <SearchIcon size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="search"
            placeholder="Client, téléphone, n° ou produit…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-[10px] border border-black/[0.08] bg-white py-2.5 pr-4 pl-10 text-sm text-ink placeholder:text-[#9CA3AF] transition focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none"
          />
        </div>

        <div className="flex flex-1 flex-wrap gap-1.5" role="tablist" aria-label="Filtrer les commandes">
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
            <h3 className="mt-4 text-base font-bold text-ink">
              {totalCount === 0 ? "Aucune commande reçue" : "Aucune commande trouvée"}
            </h3>
            <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-muted">
              {totalCount === 0
                ? "Les nouvelles commandes apparaîtront ici."
                : "Essayez une autre recherche ou un autre filtre."}
            </p>
          </div>
        ) : (
          <table className="w-full table-fixed text-left">
            <thead className="bg-[#F4F4F8] text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              <tr>
                <th className="w-[26%] py-3 pl-5 font-bold">Client</th>
                <th className="w-[8%] py-3 font-bold">N°</th>
                <th className="w-[14%] py-3 font-bold">Date</th>
                <th className="hidden w-[9%] py-3 font-bold 2xl:table-cell">Articles</th>
                <th className="w-[13%] py-3 font-bold">Statut</th>
                <th className="w-[12%] py-3 text-right font-bold">Total</th>
                <th className="py-3 pr-5 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.06]">
              {sorted.map((order) => {
                const name = orderCustomerName(order);
                const count = itemsCount(order);
                const cancelled = order.status === "cancelled";
                return (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="group cursor-pointer transition hover:bg-[#FAFAFC]"
                  >
                    <td className="py-3 pl-5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand-dark">
                          {initialsOf(name) || "#"}
                        </span>
                        <span className="min-w-0">
                          <Link
                            to={`/orders/${order.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="block truncate text-sm font-semibold text-ink hover:text-brand-dark"
                          >
                            {name}
                          </Link>
                          {order.phone && <span className="block truncate text-xs text-[#9CA3AF]">{order.phone}</span>}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-[13px] font-semibold text-ink">#{order.id}</td>
                    <td className="py-3 text-[13px] text-muted">{formatOrderDate(order.created_at)}</td>
                    <td className="hidden py-3 text-[13px] text-muted 2xl:table-cell">
                      {count} article{count > 1 ? "s" : ""}
                    </td>
                    <td className="py-3">
                      <OrderStatusPill status={order.status} />
                    </td>
                    <td
                      className={`py-3 text-right text-sm font-bold whitespace-nowrap ${
                        cancelled ? "text-[#9CA3AF] line-through" : "text-ink"
                      }`}
                    >
                      {formatXof(totalOf(order))}
                    </td>
                    <td className="py-3 pr-5">
                      <div className="flex items-center justify-end gap-2">
                        <RowActions
                          order={order}
                          saving={savingOrderIds.includes(order.id)}
                          maintenanceMode={maintenanceMode}
                          onAdvance={onAdvance}
                          onCancel={onCancel}
                        />
                        <ChevronRightIcon size={16} className="shrink-0 text-[#9CA3AF] transition group-hover:text-ink" />
                      </div>
                      {statusErrors[order.id] && (
                        <p role="alert" className="mt-1 text-right text-xs text-red-600">
                          {statusErrors[order.id]}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {sorted.length > 0 && (
        <p className="text-xs text-[#9CA3AF]">
          {sorted.length} commande{sorted.length > 1 ? "s" : ""} affichée{sorted.length > 1 ? "s" : ""} sur {totalCount}
        </p>
      )}
    </div>
  );
}
