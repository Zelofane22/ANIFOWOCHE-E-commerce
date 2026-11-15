import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  AlertCircleIcon,
  ChevronRightIcon,
  DollarSignIcon,
  EyeIcon,
  EyeOffIcon,
  PackageIcon,
  ShoppingBagIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "../icons.jsx";
import { formatXof } from "../../utils/format.js";
import PlanLimitCard from "./PlanLimitCard.jsx";

const PERIODS = [
  ["7j", "7 j"],
  ["30j", "30 j"],
  ["3m", "3 mois"],
];

const PERIOD_LABEL = {
  "7j": "7 derniers jours",
  "30j": "30 derniers jours",
  "3m": "3 derniers mois",
};

const STATUS = {
  received: { label: "Reçue", pill: "bg-blue-50 text-blue-700", dot: "bg-blue-600" },
  prepared: { label: "Préparée", pill: "bg-violet-50 text-violet-700", dot: "bg-violet-600" },
  delivered: { label: "Livrée", pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-600" },
  cancelled: { label: "Annulée", pill: "bg-red-50 text-red-700", dot: "bg-red-600" },
};

const FILTERS = [
  ["all", "Toutes"],
  ["received", "Reçues"],
  ["prepared", "Préparées"],
  ["delivered", "Livrées"],
];

const TONES = {
  brand: "bg-brand-light text-brand-dark",
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
};

const MASK = "••••••";

const initialsOf = (name) =>
  (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

const formatOrderDate = (iso) =>
  iso
    ? new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "";

function timeAgo(iso) {
  if (!iso) return "";
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  if (hours < 48) return "hier";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const itemsCount = (order) =>
  (order.items ?? []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

const formatPct = (pct) => (pct == null ? null : `${pct >= 0 ? "+" : ""}${pct}%`);

function KpiCard({ label, value, delta, sub, icon: Icon, tone = "brand", to, highlight = false }) {
  const negative = delta != null && delta.startsWith("-");
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-muted">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${TONES[tone]}`}>
          <Icon size={19} />
        </span>
      </div>
      <p className="mt-2.5 truncate text-[28px] font-extrabold leading-tight text-ink">{value}</p>
      <p className="mt-2 flex items-center gap-1.5 text-xs">
        {delta != null && (
          <span className={`font-bold ${negative ? "text-red-600" : "text-emerald-700"}`}>{delta}</span>
        )}
        <span className="font-medium text-[#9CA3AF]">{sub}</span>
      </p>
    </>
  );
  const className = `block rounded-2xl border bg-white p-5 transition ${
    highlight ? "border-amber-600/40 hover:border-amber-600/70" : "border-black/[0.07]"
  } ${to ? "hover:shadow-md" : ""}`;
  return to ? (
    <Link to={to} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function RevenueChart({ data, hidden }) {
  const [hover, setHover] = useState(null);
  const W = 700;
  const H = 220;

  const points = useMemo(() => {
    const max = Math.max(...data.map((d) => Number(d.value) || 0), 1);
    return data.map((d, i) => ({
      x: data.length === 1 ? W / 2 : (i / (data.length - 1)) * W,
      y: 12 + (H - 24) - ((Number(d.value) || 0) / max) * (H - 24),
      ...d,
    }));
  }, [data]);

  if (points.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-xl bg-[#F9F9FB] text-sm text-[#9CA3AF]">
        Aucune vente sur la période.
      </div>
    );
  }

  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const labelStep = Math.max(1, Math.ceil(points.length / 5));
  const labels = points.filter((_, i) => i % labelStep === 0 || i === points.length - 1);
  const active = hover != null ? points[hover] : null;

  const handleMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    setHover(points.length === 1 ? 0 : Math.round(ratio * (points.length - 1)));
  };

  return (
    <div>
      <div className="relative h-[220px]" onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-full w-full overflow-visible"
          preserveAspectRatio="none"
          role="img"
          aria-label="Évolution du chiffre d'affaires"
        >
          <defs>
            <linearGradient id="desktopGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C99F08" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#C99F08" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((g) => {
            const y = 12 + (g * (H - 24)) / 3;
            return (
              <line
                key={g}
                x1="0"
                x2={W}
                y1={y}
                y2={y}
                stroke="#E8E8EE"
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
          <polyline points={`0,${H} ${line} ${W},${H}`} fill="url(#desktopGold)" stroke="none" />
          <polyline
            points={line}
            fill="none"
            stroke="#C99F08"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          {active && (
            <line
              x1={active.x}
              x2={active.x}
              y1={active.y}
              y2={H}
              stroke="#C99F08"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
        {active && (
          <>
            <span
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-[#C99F08] bg-white"
              style={{ left: `${(active.x / W) * 100}%`, top: `${(active.y / H) * 100}%` }}
            />
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+12px)] whitespace-nowrap rounded-lg bg-[#111827] px-2.5 py-1.5 text-center shadow-lg"
              style={{ left: `${(active.x / W) * 100}%`, top: `${(active.y / H) * 100}%` }}
            >
              <p className="text-[11px] font-semibold text-[#9CA3AF]">{active.label}</p>
              <p className="text-xs font-bold text-white">{hidden ? MASK : formatXof(active.value)}</p>
            </div>
          </>
        )}
      </div>
      <div className="mt-3 flex justify-between text-[11px] font-medium text-[#9CA3AF]">
        {labels.map((p) => (
          <span key={`${p.label}-${p.x}`}>{p.label}</span>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const meta = STATUS[status] || STATUS.received;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${meta.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function OrdersTable({ orders }) {
  const [filter, setFilter] = useState("all");
  const rows = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <section className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
      <div className="flex items-center gap-3 px-5 pt-5 pb-3.5">
        <h2 className="flex-1 text-base font-bold text-ink">Commandes récentes</h2>
        <div className="flex gap-1.5" role="tablist" aria-label="Filtrer les commandes">
          {FILTERS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              onClick={() => setFilter(value)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                filter === value ? "bg-ink text-white" : "bg-[#F4F4F8] text-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="border-t border-black/[0.06] px-5 py-10 text-center text-sm text-[#9CA3AF]">
          {orders.length === 0 ? "Aucune commande pour le moment." : "Aucune commande récente avec ce statut."}
        </p>
      ) : (
        <table className="w-full table-fixed text-left">
          <thead className="bg-[#F4F4F8] text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
            <tr>
              <th className="w-[34%] py-2.5 pl-5 font-bold">Client</th>
              <th className="w-[11%] py-2.5 font-bold">N°</th>
              <th className="w-[17%] py-2.5 font-bold">Date</th>
              <th className="hidden w-[11%] py-2.5 font-bold 2xl:table-cell">Articles</th>
              <th className="w-[15%] py-2.5 font-bold">Statut</th>
              <th className="py-2.5 pr-5 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.06]">
            {rows.map((order) => {
              const name = order.full_name || order.customer_name || `Commande #${order.id}`;
              const count = itemsCount(order);
              return (
                <tr key={order.id} className="group cursor-pointer transition hover:bg-[#FAFAFC]">
                  <td className="py-3 pl-5">
                    <Link to={`/orders/${order.id}`} className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand-dark">
                        {initialsOf(name) || "#"}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">{name}</span>
                        {order.phone && <span className="block truncate text-xs text-[#9CA3AF]">{order.phone}</span>}
                      </span>
                    </Link>
                  </td>
                  <td className="py-3 text-[13px] font-semibold text-ink">#{order.id}</td>
                  <td className="py-3 text-[13px] text-muted">{formatOrderDate(order.created_at)}</td>
                  <td className="hidden py-3 text-[13px] text-muted 2xl:table-cell">
                    {count} article{count > 1 ? "s" : ""}
                  </td>
                  <td className="py-3">
                    <StatusPill status={order.status} />
                  </td>
                  <td className="py-3 pr-5">
                    <Link
                      to={`/orders/${order.id}`}
                      className="flex items-center justify-end gap-2 whitespace-nowrap text-sm font-bold text-ink"
                      aria-label={`Voir la commande #${order.id}`}
                    >
                      {formatXof(order.total_xof ?? order.total)}
                      <ChevronRightIcon size={16} className="text-[#9CA3AF] transition group-hover:text-ink" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <Link
        to="/orders"
        className="block border-t border-black/[0.06] py-3.5 text-center text-[13px] font-bold text-brand-dark transition hover:bg-[#FAFAFC]"
      >
        Voir toutes les commandes →
      </Link>
    </section>
  );
}

export default function DashboardDesktop({
  period,
  onPeriodChange,
  hideBalance,
  onToggleBalance,
  revenue,
  revenueChangePct,
  ordersCount,
  ordersChangePct,
  pendingCount,
  productsCount,
  chartData,
  recentOrders,
  lowStock,
  plan,
  limits,
  planMeta,
}) {
  const pendingOrders = recentOrders.filter((o) => o.status === "received");
  const revenueDelta = formatPct(revenueChangePct);
  const maxProducts = limits?.max_products;

  return (
    <div className="space-y-6 px-8 pt-7 pb-8">
      <div className="grid grid-cols-4 gap-5">
        <KpiCard
          label="Chiffre d'affaires"
          value={hideBalance ? MASK : formatXof(revenue)}
          delta={revenueDelta}
          sub="vs période précédente"
          icon={DollarSignIcon}
          tone="brand"
        />
        <KpiCard
          label="Commandes"
          value={ordersCount}
          delta={formatPct(ordersChangePct)}
          sub="vs période précédente"
          icon={ShoppingBagIcon}
          tone="blue"
        />
        <KpiCard
          label="En attente"
          value={pendingCount}
          sub={pendingCount > 0 ? "à traiter maintenant →" : "rien à traiter"}
          icon={AlertCircleIcon}
          tone="amber"
          to="/orders?filter=pending"
          highlight={pendingCount > 0}
        />
        <KpiCard
          label="Produits"
          value={productsCount}
          sub={maxProducts != null ? `sur ${maxProducts} · offre ${planMeta.name}` : `offre ${planMeta.name}`}
          icon={PackageIcon}
          tone="emerald"
          to="/products"
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-5">
        <section className="rounded-2xl border border-black/[0.07] bg-white p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-ink">Chiffre d&apos;affaires</h2>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-2xl font-extrabold text-ink">{hideBalance ? MASK : formatXof(revenue)}</p>
                {revenueDelta && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                      revenueChangePct >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}
                  >
                    {revenueChangePct >= 0 ? <TrendingUpIcon size={14} /> : <TrendingDownIcon size={14} />}
                    {revenueDelta}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-[#9CA3AF]">{PERIOD_LABEL[period]}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleBalance}
                className="flex h-9 w-9 items-center justify-center rounded-[10px] text-muted transition hover:bg-gray-100 hover:text-ink"
                aria-label={hideBalance ? "Afficher les montants" : "Masquer les montants"}
                title={hideBalance ? "Afficher les montants" : "Masquer les montants"}
              >
                {hideBalance ? <EyeIcon size={18} /> : <EyeOffIcon size={18} />}
              </button>
              <div className="flex gap-0.5 rounded-[10px] bg-[#F4F4F8] p-[3px]">
                {PERIODS.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onPeriodChange(value)}
                    className={`rounded-lg px-3 py-1.5 text-xs transition ${
                      period === value
                        ? "bg-white font-bold text-ink shadow-sm"
                        : "font-semibold text-muted hover:text-ink"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <RevenueChart data={chartData} hidden={hideBalance} />
        </section>

        <section className="flex flex-col rounded-2xl border border-black/[0.07] bg-white p-6">
          <div className="flex items-center gap-2">
            <h2 className="flex-1 text-base font-bold text-ink">À traiter</h2>
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">{pendingCount}</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted">Commandes reçues en attente de préparation</p>

          {pendingOrders.length === 0 ? (
            <p className="flex flex-1 items-center justify-center py-8 text-center text-sm text-[#9CA3AF]">
              {pendingCount > 0 ? "Les commandes à traiter sont dans l'onglet Commandes." : "Aucune commande en attente."}
            </p>
          ) : (
            <ul className="mt-2 flex-1 divide-y divide-black/[0.06]">
              {pendingOrders.slice(0, 4).map((order) => (
                <li key={order.id}>
                  <Link
                    to={`/orders/${order.id}`}
                    className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition hover:bg-[#FAFAFC]"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-amber-600" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {order.full_name || `Commande #${order.id}`}
                      </span>
                      <span className="block text-xs text-[#9CA3AF]">
                        #{order.id} · {timeAgo(order.created_at)}
                      </span>
                    </span>
                    <span className="text-sm font-bold text-ink">{formatXof(order.total_xof ?? order.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Link
            to="/orders?filter=pending"
            className="mt-3 flex items-center justify-center gap-1.5 rounded-[10px] border border-black/[0.08] px-4 py-2.5 text-sm font-bold text-ink transition hover:border-brand hover:text-brand-dark"
          >
            {pendingCount > 0 ? `Voir les ${pendingCount} commandes` : "Voir les commandes"}
            <ChevronRightIcon size={16} />
          </Link>
        </section>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_360px] items-start gap-5">
        <OrdersTable orders={recentOrders} />

        <div className="space-y-5">
          {lowStock.length > 0 && (
            <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                  <AlertCircleIcon size={17} className="text-orange-600" />
                </span>
                <h2 className="flex-1 text-[15px] font-bold text-orange-800">Stock faible</h2>
                <span className="text-xs font-semibold text-orange-700">
                  {lowStock.length} produit{lowStock.length > 1 ? "s" : ""}
                </span>
              </div>
              <ul className="mt-3 space-y-2">
                {lowStock.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 rounded-[10px] bg-white px-3 py-2.5">
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">{item.name}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        item.stock <= 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {item.stock <= 0 ? "Rupture" : `${item.stock} restant${item.stock > 1 ? "s" : ""}`}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                to="/products"
                className="mt-3 inline-flex text-xs font-bold text-orange-800 transition hover:text-orange-900"
              >
                Gérer les stocks →
              </Link>
            </section>
          )}

          {limits && (
            <PlanLimitCard
              plan={plan}
              limits={limits}
              productsCount={productsCount}
              ordersCount={ordersCount}
              planMeta={planMeta}
            />
          )}
        </div>
      </div>
    </div>
  );
}
