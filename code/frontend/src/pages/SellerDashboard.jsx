import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getSellerDashboard } from "../api/seller.js";
import {
  ArrowUpIcon,
  BarChartIcon,
  CopyIcon,
  DollarSignIcon,
  ExternalLinkIcon,
  LayoutDashboardIcon,
  PackageIcon,
  SettingsIcon,
  StoreIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "../components/icons.jsx";
import SellerShell from "../components/seller/SellerShell.jsx";
import { useAuth } from "../context/useAuth.js";

const STATUS_LABELS = {
  received: "Reçue",
  prepared: "Préparée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const STATUS_COLORS = {
  received: "bg-amber-400",
  prepared: "bg-blue-400",
  delivered: "bg-green-400",
  cancelled: "bg-gray-300",
};

function formatXOF(amount) {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

function KPICard({ label, value, Icon, change, format }) {
  const displayValue = format ? format(value) : value;
  const isPositive = change != null && change >= 0;
  const isNegative = change != null && change < 0;
  return (
    <div className="rounded-xl border border-black/10 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-muted">{label}</p>
        <Icon size={18} className="text-brand-dark shrink-0" />
      </div>
      <p className="mt-3 text-3xl font-bold text-ink">{displayValue}</p>
      {change != null && (
        <p className={`mt-1 flex items-center gap-1 text-xs font-semibold ${isPositive ? "text-green-600" : isNegative ? "text-red-500" : "text-muted"}`}>
          {isPositive ? <TrendingUpIcon size={14} /> : isNegative ? <TrendingDownIcon size={14} /> : <ArrowUpIcon size={14} className="opacity-30" />}
          {isPositive ? "+" : ""}{change}%
        </p>
      )}
    </div>
  );
}

function MiniBar({ value, max, color }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
    </div>
  );
}

function SalesChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">Aucune vente sur cette période</p>;
  }
  const maxVal = Math.max(...data.map((d) => d.total), 1);
  return (
    <div className="flex items-end gap-[2px] sm:gap-[3px]" style={{ height: 160 }}>
      {data.map((point, i) => (
        <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
          <div
            className="w-full rounded-t-sm bg-brand transition-all hover:bg-brand-medium"
            style={{ height: `${(point.total / maxVal) * 140}px`, minHeight: point.total > 0 ? 4 : 0 }}
            title={`${point.day}: ${formatXOF(point.total)}`}
          />
          {data.length <= 14 && (
            <span className="text-[10px] text-muted" style={{ writingMode: "vertical-lr", textOrientation: "mixed" }}>
              {point.day}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_COLORS[status] || "bg-gray-300"}`} />
  );
}

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [copyLabel, setCopyLabel] = useState("Copier");

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    getSellerDashboard()
      .then(setDashboard)
      .catch((err) => {
        navigate(err?.response?.status === 404 ? "/register" : "/login", { replace: true });
      });
  }, [isAuthenticated, loading, navigate]);

  if (loading || !dashboard) {
    return <div className="min-h-screen bg-[#f7f6f2] px-4 py-10 text-center text-muted">Chargement...</div>;
  }

  const { seller, metrics, kpi, sales_chart, top_products, recent_orders, low_stock, status_distribution } = dashboard;
  const publicUrl = seller.shop.public_url;

  const copyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopyLabel("Copié");
      window.setTimeout(() => setCopyLabel("Copier"), 1500);
    } catch {
      setCopyLabel("Copie indisponible");
    }
  };

  return (
    <SellerShell title="Tableau de bord" seller={seller}>
      <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="rounded-xl border border-black/10 bg-white p-5 sm:p-6">
          <p className="text-sm font-semibold text-brand-dark">ANIF Seller</p>
          <h2 className="mt-2 text-2xl font-bold text-ink">Bienvenue, {seller.display_name}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Votre boutique est prête à recevoir des produits. Ajoutez vos articles, gardez le stock à jour
            et partagez le lien public quand le catalogue est publié.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-medium sm:inline-flex sm:w-auto w-full"
            >
              <PackageIcon size={15} />
              Gérer les produits
            </Link>
            <Link
              to="/settings"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-black/15 px-4 py-2.5 text-sm font-bold text-ink transition hover:border-brand hover:text-brand-dark sm:inline-flex sm:w-auto w-full"
            >
              <SettingsIcon size={15} />
              Paramètres boutique
            </Link>
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-black/15 px-4 py-2.5 text-sm font-bold text-ink transition hover:border-brand hover:text-brand-dark sm:inline-flex sm:w-auto w-full"
            >
              <ExternalLinkIcon size={15} />
              Voir la boutique
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-5">
          <p className="text-sm font-bold text-ink">Lien public</p>
          <p className="mt-2 break-all rounded-lg bg-gray-50 px-3 py-2 text-sm text-muted">{publicUrl}</p>
          <button
            type="button"
            onClick={copyPublicUrl}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-black/15 px-4 py-2.5 text-sm font-bold text-ink transition hover:border-brand hover:text-brand-dark"
          >
            <CopyIcon size={15} />
            {copyLabel}
          </button>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Revenu (30j)" value={kpi.revenue} format={formatXOF} Icon={DollarSignIcon} change={kpi.revenue_change} />
        <KPICard label="Commandes (30j)" value={kpi.orders} Icon={LayoutDashboardIcon} change={kpi.orders_change} />
        <KPICard label="Produits" value={metrics.products} Icon={PackageIcon} />
        <KPICard label="En attente" value={metrics.pending_orders} Icon={StoreIcon} />
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-black/10 bg-white p-5">
          <div className="flex items-center gap-2">
            <BarChartIcon size={16} className="text-brand-dark" />
            <h3 className="text-sm font-bold text-ink">Ventes des 30 derniers jours</h3>
          </div>
          <div className="mt-4">
            <SalesChart data={sales_chart} />
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-5">
          <h3 className="text-sm font-bold text-ink">Statut des commandes</h3>
          <div className="mt-4 grid gap-3">
            {Object.entries(STATUS_LABELS).map(([key, label]) => {
              const count = status_distribution?.[key] || 0;
              const total = metrics.total_orders || 1;
              return (
                <div key={key} className="flex items-center gap-3">
                  <StatusBadge status={key} />
                  <span className="flex-1 text-sm text-muted">{label}</span>
                  <span className="text-sm font-bold text-ink">{count}</span>
                  <span className="w-8 text-right text-xs text-muted">{Math.round((count / total) * 100)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-white p-5">
          <h3 className="text-sm font-bold text-ink">Meilleurs produits</h3>
          {top_products.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Aucune vente pour le moment</p>
          ) : (
            <div className="mt-4 grid gap-3">
              {top_products.map((p, i) => {
                const maxRev = top_products[0]?.revenue || 1;
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="w-5 text-sm font-bold text-muted">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink truncate">{p.name}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                        <span>{formatXOF(p.revenue)}</span>
                        <span>{p.quantity} vendu{p.quantity > 1 ? "s" : ""}</span>
                      </div>
                      <MiniBar value={p.revenue} max={maxRev} color="bg-brand" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-5">
          <h3 className="text-sm font-bold text-ink">Stock faible</h3>
          {low_stock.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Tous les produits ont un stock suffisant</p>
          ) : (
            <div className="mt-4 grid gap-3">
              {low_stock.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <PackageIcon size={15} className="text-red-400 shrink-0" />
                  <p className="flex-1 text-sm text-ink truncate">{p.name}</p>
                  <span className={`text-sm font-bold ${p.stock === 0 ? "text-red-500" : "text-amber-500"}`}>
                    {p.stock}
                  </span>
                </div>
              ))}
              <Link
                to="/products"
                className="mt-2 inline-block text-xs font-semibold text-brand-dark hover:underline"
              >
                Voir tous les produits →
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-black/10 bg-white p-5">
        <h3 className="text-sm font-bold text-ink">Dernières commandes</h3>
        {recent_orders.length === 0 ? (
          <p className="mt-4 py-4 text-center text-sm text-muted">Aucune commande reçue</p>
        ) : (
          <div className="mt-4 grid gap-2">
            {recent_orders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex flex-col gap-2 rounded-lg border border-black/5 px-4 py-3 transition hover:bg-gray-50 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <div>
                    <p className="text-sm font-medium text-ink">{order.full_name}</p>
                    <p className="text-xs text-muted">
                      CMD-{String(order.id).padStart(6, "0")} · {new Date(order.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-ink">{formatXOF(order.total_xof)}</p>
                  <p className="text-xs text-muted">{STATUS_LABELS[order.status] || order.status}</p>
                </div>
              </Link>
            ))}
            <Link
              to="/orders"
              className="mt-1 inline-block text-center text-xs font-semibold text-brand-dark hover:underline"
            >
              Voir toutes les commandes →
            </Link>
          </div>
        )}
      </section>
    </SellerShell>
  );
}
