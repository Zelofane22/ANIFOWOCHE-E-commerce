import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { getSellerDashboard } from "../api/seller.js";
import {
  BellIcon,
  BarChartIcon,
  PackageIcon,
  PlusIcon,
  Share2Icon,
  TrendingUpIcon,
  TrendingDownIcon,
  AlertCircleIcon,
} from "../components/icons.jsx";
import SellerShell from "../components/seller/SellerShell.jsx";
import { useAuth } from "../context/useAuth.js";

const STATUS_CONFIG = {
  received: { label: "Recue", color: "bg-blue-500" },
  prepared: { label: "Preparee", color: "bg-amber-500" },
  delivered: { label: "Livree", color: "bg-emerald-500" },
  cancelled: { label: "Annulee", color: "bg-red-500" },
};

const PLAN_META = {
  FREE: { name: "Gratuit", color: "text-gray-500", bg: "bg-gray-100" },
  STARTER: { name: "Starter", color: "text-blue-600", bg: "bg-blue-50" },
  PRO: { name: "Pro", color: "text-brand", bg: "bg-brand/10" },
  BUSINESS: { name: "Business", color: "text-purple-600", bg: "bg-purple-50" },
};

const PERIOD_MAP = { "7j": 7, "30j": 30, "3m": 90 };

function formatXOF(amount) {
  if (amount == null) return "0 F";
  return Number(amount).toLocaleString("fr-FR") + " F";
}

function MiniBar({ value, max }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full rounded-full bg-brand transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function SellerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [copyLabel, setCopyLabel] = useState("Copier");
  const [period, setPeriod] = useState("30j");
  const [hideBalance, setHideBalance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function fetchDashboard() {
      try {
        setLoading(true);
        const res = await getSellerDashboard({ period: PERIOD_MAP[period] || 30 });
        if (!cancelled) setData(res);
      } catch (err) {
        console.error("Failed to load dashboard", err);
        if (!cancelled) setError(err?.response?.data?.detail || err.message || "Erreur de chargement");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchDashboard();
    return () => { cancelled = true; };
  }, [user, period]);

  if (error) {
    return (
      <SellerShell seller={data?.seller} pendingCount={0}>
        <div className="mx-auto max-w-2xl px-4 pt-8 text-center text-sm text-red-500">
          {error}
        </div>
      </SellerShell>
    );
  }

  if (authLoading || loading || !data) {
    return (
      <SellerShell seller={data?.seller} pendingCount={0}>
        <div className="mx-auto max-w-2xl space-y-4 px-4 pt-4">
          <div className="animate-pulse space-y-4">
            <div className="h-64 rounded-2xl bg-gray-200" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-20 rounded-2xl bg-gray-200" />
              <div className="h-20 rounded-2xl bg-gray-200" />
            </div>
            <div className="h-16 rounded-2xl bg-gray-200" />
          </div>
        </div>
      </SellerShell>
    );
  }

  const shop_name = data.seller?.shop?.name ?? data.seller?.display_name ?? "";
  const plan = data.seller?.plan ?? "FREE";
  const limits = data.seller?.limits ?? null;
  const revenue = data.kpi?.revenue ?? 0;
  const revenue_change_pct = data.kpi?.revenue_change ?? 0;
  const orders_count = data.kpi?.orders ?? 0;
  const revenue_chart = data.sales_chart ?? [];
  const recent_orders = data.recent_orders ?? [];
  const low_stock = data.low_stock ?? [];
  const pending_count = data.metrics?.pending_orders ?? 0;
  const products_count = data.metrics?.products ?? 0;
  const revenue_today = 0;
  const products_used = limits?.products_used ?? products_count;
  const orders_used = limits?.orders_this_month ?? orders_count;
  const products_near_limit = plan === "FREE" && limits?.max_products != null && products_used / limits.max_products >= 0.8;
  const orders_near_limit = plan === "FREE" && limits?.max_orders_per_month != null && orders_used / limits.max_orders_per_month >= 0.8;

  const planMeta = PLAN_META[plan] || PLAN_META.FREE;
  const chartData = revenue_chart.map((d) => ({
    label: d.day,
    value: d.total,
  }));

  const handleCopyLink = () => {
    const url = `${window.location.origin}/boutique`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyLabel("Copie !");
      setTimeout(() => setCopyLabel("Copier"), 2000);
    });
  };

  return (
    <SellerShell seller={data.seller} pendingCount={pending_count}>
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="-mx-4 rounded-2xl bg-[#111827] px-5 pt-8 pb-6 sm:mx-0 sm:rounded-2xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Bonjour
              </p>
              <h1 className="mt-1 text-xl font-bold text-white">{shop_name}</h1>
            </div>
            <Link
              to="/notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <BellIcon className="h-5 w-5" />
              {pending_count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {pending_count}
                </span>
              )}
            </Link>
          </div>

          <div className="rounded-[20px] bg-white/10 p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-300">CA ce mois</p>
              <button
                onClick={() => setHideBalance(!hideBalance)}
                className="text-xs text-gray-400 transition hover:text-white"
              >
                {hideBalance ? "Afficher" : "Masquer"}
              </button>
            </div>

            <p className="text-3xl font-bold text-white">
              {hideBalance ? "\u2022\u2022\u2022\u2022\u2022\u2022" : formatXOF(revenue)}
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Aujourd&apos;hui : {hideBalance ? "\u2022\u2022\u2022\u2022" : formatXOF(revenue_today)}
            </p>

            <div className="mt-3 flex items-center gap-1.5">
              {revenue_change_pct >= 0 ? (
                <TrendingUpIcon className="h-4 w-4 text-emerald-400" />
              ) : (
                <TrendingDownIcon className="h-4 w-4 text-red-400" />
              )}
              <span
                className={
                  revenue_change_pct >= 0
                    ? "text-sm font-medium text-emerald-400"
                    : "text-sm font-medium text-red-400"
                }
              >
                {revenue_change_pct >= 0 ? "+" : ""}
                {revenue_change_pct}%
              </span>
              <span className="text-xs text-gray-500">vs mois prec.</span>
            </div>

            <div className="mt-5 flex gap-1 rounded-full bg-white/5 p-1">
              {["7j", "30j", "3m"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={
                    period === p
                      ? "flex-1 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white transition"
                      : "flex-1 rounded-full px-3 py-1.5 text-xs font-medium text-gray-400 transition hover:text-white"
                  }
                >
                  {p}
                </button>
              ))}
            </div>

            {chartData.length > 0 && (
              <div className="mt-5 h-32">
                <svg viewBox="0 0 600 130" className="h-full w-full" preserveAspectRatio="none" role="img" aria-label="Evolution du chiffre d'affaires">
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C99F08" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#C99F08" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {(() => {
                    const max = Math.max(...chartData.map((point) => Number(point.value) || 0), 1);
                    const points = chartData.map((point, index) => {
                      const x = chartData.length === 1 ? 300 : (index / (chartData.length - 1)) * 600;
                      const y = 10 + 90 - ((Number(point.value) || 0) / max) * 90;
                      return `${x},${y}`;
                    }).join(" ");
                    return (
                      <>
                        <polyline points={`0,100 ${points} 600,100`} fill="url(#goldGradient)" stroke="none" />
                        <polyline points={points} fill="none" stroke="#C99F08" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                      </>
                    );
                  })()}
                </svg>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 px-4 sm:px-0">
          {[
            { label: "Commandes", value: orders_count, sub: "ce mois", color: "text-blue-600" },
            { label: "Actifs", value: products_count, sub: "produits", color: "text-emerald-600" },
            { label: "En attente", value: pending_count, sub: "a traiter", color: "text-amber-600" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-black/[0.05] bg-white p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className={`mt-0.5 text-xs font-bold ${stat.color}`}>{stat.label}</p>
              <p className="text-[10px] text-gray-400">{stat.sub}</p>
            </div>
          ))}
        </div>

        <div className="px-4 sm:px-0">
          <p className="mb-3 px-1 text-sm font-bold text-gray-700">Actions rapides</p>
          <div className="grid grid-cols-4 gap-3">
          <Link
            to="/products/new"
            className="group flex flex-col items-center gap-2"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-brand text-white shadow-sm transition group-active:scale-95">
              <PlusIcon className="h-5 w-5" />
            </div>
            <span className="text-center text-[10px] font-semibold leading-snug text-gray-700">Ajouter<br />produit</span>
          </Link>
          <button
            onClick={handleCopyLink}
            className="group flex flex-col items-center gap-2"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-emerald-50 shadow-sm transition group-active:scale-95">
              <Share2Icon className="h-5 w-5 text-emerald-500" />
            </div>
            <span className="text-center text-[10px] font-semibold leading-snug text-gray-700">{copyLabel}</span>
          </button>
          <Link
            to="/orders"
            className="group flex flex-col items-center gap-2"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-blue-50 shadow-sm transition group-active:scale-95">
              <PackageIcon className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">Commandes</span>
          </Link>
          <Link to="/stats" className="group flex flex-col items-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-violet-50 shadow-sm transition group-active:scale-95">
              <BarChartIcon className="h-5 w-5 text-violet-600" />
            </div>
            <span className="text-center text-[10px] font-semibold leading-snug text-gray-700">Stats</span>
          </Link>
          </div>
        </div>

        {pending_count > 0 && (
          <div className="mx-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:mx-0">
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <AlertCircleIcon className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold leading-snug text-gray-900">{pending_count} commande{pending_count > 1 ? "s" : ""} necessite{pending_count > 1 ? "nt" : ""} votre attention</p>
                <p className="mt-1 text-xs text-gray-500">Consultez vos commandes en attente de traitement.</p>
              </div>
            </div>
            <Link to="/orders" className="flex w-full items-center justify-center rounded-[10px] bg-amber-100 py-2.5 text-sm font-bold text-amber-700 transition hover:bg-amber-200">
              Voir les commandes
            </Link>
          </div>
        )}

        {low_stock.length > 0 && (
          <div className="mx-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:mx-0">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100">
                <AlertCircleIcon className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-orange-800">
                  Stock faible
                </p>
                <p className="mt-0.5 text-xs text-orange-600">
                  {low_stock.length} produit{low_stock.length > 1 ? "s" : ""} en
                  rupture ou bientot en rupture de stock.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {low_stock.map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-medium text-orange-700"
                    >
                      {item.name}
                      <span className="text-orange-400">({item.stock})</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {limits && (
          <div className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm mx-4 sm:mx-0">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Votre offre</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900">{planMeta.name}</p>
              </div>
              <span className={`rounded-full border border-brand/25 px-2.5 py-1 text-[10px] font-bold uppercase ${planMeta.color} ${planMeta.bg}`}>
                {planMeta.name}
              </span>
            </div>
            <div className="space-y-3">
              {limits.max_products != null && (
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Produits</span>
                    <span className="font-medium text-gray-700">
                      {products_count}/{limits.max_products}
                    </span>
                  </div>
                  <MiniBar value={products_count} max={limits.max_products} />
                </div>
              )}
              {limits.max_orders_per_month != null && (
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Commandes / mois</span>
                    <span className="font-medium text-gray-700">
                      {orders_count}/{limits.max_orders_per_month}
                    </span>
                  </div>
                  <MiniBar value={orders_count} max={limits.max_orders_per_month} />
                </div>
              )}
            </div>
            {plan === "FREE" && (products_near_limit || orders_near_limit) ? (
              <div className="mt-4 rounded-xl bg-[#FEF9E7] p-3">
                <p className="text-xs leading-relaxed text-[#8B6604]">
                  Vous approchez de la limite de votre offre Gratuit. Passez à Starter pour gérer jusqu&apos;à 100 produits et 100 commandes.
                </p>
                <Link to="/plan" className="mt-2 inline-flex text-xs font-bold text-[#8B6604] transition hover:text-[#6B4F03]">
                  Passer à Starter pour vendre plus
                </Link>
              </div>
            ) : (
              <Link to="/plan" className="mt-3 inline-flex text-xs font-bold text-brand transition hover:text-brand/80">
                Voir les offres
              </Link>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm mx-4 sm:mx-0">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Commandes recentes</p>
            <Link
              to="/orders"
              className="text-xs font-medium text-brand transition hover:text-brand/80"
            >
              Tout voir
            </Link>
          </div>
          {recent_orders.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              Aucune commande pour le moment.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recent_orders.map((order) => {
                const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.received;
                return (
                  <Link
                    key={order.id}
                    to={`/orders/${order.id}`}
                    className="flex items-center justify-between py-3 transition first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${status.color}`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {order.full_name || order.customer_name || `Commande #${order.id}`}
                        </p>
                        <p className="text-xs text-gray-400">{status.label}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatXOF(order.total_xof ?? order.total)}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </SellerShell>
  );
}
