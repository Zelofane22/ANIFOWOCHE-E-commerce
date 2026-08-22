import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { getSellerDashboard } from "../api/seller.js";
import {
  BellIcon,
  DollarSignIcon,
  PackageIcon,
  PlusIcon,
  Share2Icon,
  TrendingUpIcon,
  TrendingDownIcon,
  AlertCircleIcon,
} from "../components/icons.jsx";
import SellerShell from "../components/seller/SellerShell.jsx";
import { useAuth } from "../context/useAuth.js";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

const STATUS_CONFIG = {
  received: { label: "Recue", color: "bg-blue-500" },
  prepared: { label: "Preparee", color: "bg-amber-500" },
  delivered: { label: "Livree", color: "bg-emerald-500" },
  cancelled: { label: "Annulee", color: "bg-red-500" },
};

const PLAN_META = {
  FREE: { name: "Free", color: "text-gray-500", bg: "bg-gray-100" },
  STARTER: { name: "Starter", color: "text-blue-600", bg: "bg-blue-50" },
  PRO: { name: "Pro", color: "text-brand", bg: "bg-brand/10" },
  BUSINESS: { name: "Business", color: "text-purple-600", bg: "bg-purple-50" },
};

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

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-[#1a1a2e] px-3 py-2 text-xs text-white shadow-lg">
      <p className="font-medium">{label}</p>
      <p className="text-brand font-semibold">{formatXOF(payload[0].value)}</p>
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
        const res = await getSellerDashboard({ period });
        if (!cancelled) setData(res.data);
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchDashboard();
    return () => { cancelled = true; };
  }, [user, period]);

  if (authLoading || loading || !data) {
    return (
      <SellerShell>
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

  const {
    shop_name,
    revenue = 0,
    revenue_today = 0,
    revenue_change_pct = 0,
    revenue_chart = [],
    orders_count = 0,
    customers_count = 0,
    recent_orders = [],
    low_stock = [],
    limits,
    pending_count = 0,
    plan,
  } = data;

  const planMeta = PLAN_META[plan] || PLAN_META.FREE;
  const chartData = revenue_chart.map((d) => ({
    label: d.label,
    value: d.value,
  }));

  const handleCopyLink = () => {
    const url = `${window.location.origin}/boutique`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyLabel("Copie !");
      setTimeout(() => setCopyLabel("Copier"), 2000);
    });
  };

  return (
    <SellerShell pendingCount={pending_count}>
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
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="goldGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#C99F08"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="100%"
                          stopColor="#C99F08"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#6b7280", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#C99F08"
                      strokeWidth={2}
                      fill="url(#goldGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 px-4 sm:px-0">
          <div className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                <PackageIcon className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Ventes</p>
                <p className="text-lg font-bold text-gray-900">{orders_count}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50">
                <DollarSignIcon className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Clients</p>
                <p className="text-lg font-bold text-gray-900">{customers_count}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 px-4 sm:px-0">
          <Link
            to="/products/new"
            className="flex flex-col items-center gap-2 rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10">
              <PlusIcon className="h-5 w-5 text-brand" />
            </div>
            <span className="text-xs font-medium text-gray-700">Nouveau produit</span>
          </Link>
          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center gap-2 rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
              <Share2Icon className="h-5 w-5 text-emerald-500" />
            </div>
            <span className="text-xs font-medium text-gray-700">{copyLabel}</span>
          </button>
          <Link
            to="/orders"
            className="flex flex-col items-center gap-2 rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
              <PackageIcon className="h-5 w-5 text-amber-500" />
            </div>
            <span className="text-xs font-medium text-gray-700">Commandes</span>
          </Link>
        </div>

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
              <p className="text-sm font-semibold text-gray-900">Plan {planMeta.name}</p>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${planMeta.color} ${planMeta.bg}`}>
                {planMeta.name}
              </span>
            </div>
            <div className="space-y-3">
              {limits.products && (
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Produits</span>
                    <span className="font-medium text-gray-700">
                      {limits.products.used}/{limits.products.limit}
                    </span>
                  </div>
                  <MiniBar value={limits.products.used} max={limits.products.limit} />
                </div>
              )}
              {limits.orders && (
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Commandes / mois</span>
                    <span className="font-medium text-gray-700">
                      {limits.orders.used}/{limits.orders.limit}
                    </span>
                  </div>
                  <MiniBar value={limits.orders.used} max={limits.orders.limit} />
                </div>
              )}
              {limits.gallery && (
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Galerie</span>
                    <span className="font-medium text-gray-700">
                      {limits.gallery.used}/{limits.gallery.limit}
                    </span>
                  </div>
                  <MiniBar value={limits.gallery.used} max={limits.gallery.limit} />
                </div>
              )}
            </div>
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
                          {order.customer_name || `Commande #${order.id}`}
                        </p>
                        <p className="text-xs text-gray-400">{status.label}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatXOF(order.total)}
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
