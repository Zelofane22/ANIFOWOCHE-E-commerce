import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  AlertCircleIcon,
  BarChartIcon,
  ChevronLeftIcon,
  CheckIcon,
  CircleIcon,
  TrendingUpIcon,
} from "../components/icons.jsx";
import { getSellerDashboard } from "../api/seller.js";
import SellerShell from "../components/seller/SellerShell.jsx";
import { useAuth } from "../context/useAuth.js";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PERIODS = [
  { key: "7j", label: "7 jours", days: 7 },
  { key: "30j", label: "30 jours", days: 30 },
  { key: "3m", label: "3 mois", days: 90 },
];

const STATUS_META = {
  received: { label: "Recues", color: "#C99F08" },
  prepared: { label: "En preparation", color: "#2563EB" },
  delivered: { label: "Livrees", color: "#059669" },
  cancelled: { label: "Annulees", color: "#DC2626" },
};

const PIE_COLORS = ["#C99F08", "#2563EB", "#059669", "#DC2626", "#7C3AED", "#EA580C"];

function formatXOF(amount) {
  return `${Number(amount || 0).toLocaleString("fr-FR")} F`;
}

function formatAverage(amount) {
  return `${Math.round(Number(amount || 0) / 1000)}k F`;
}

function StatCard({ icon: Icon, iconClass, label, value, detail, children }) {
  return (
    <div className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className={`h-4 w-4 ${iconClass}`} />
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs leading-snug text-gray-400">{detail}</p>
      {children}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-[#111827] px-3 py-2 text-xs text-white shadow-lg">
      <p className="text-gray-400">{label}</p>
      <p className="mt-0.5 font-bold">{formatXOF(payload[0].value)}</p>
    </div>
  );
}

export default function SellerStats() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState("30j");
  const [view, setView] = useState("bar");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, navigate, user]);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    getSellerDashboard({ period: PERIODS.find((item) => item.key === period)?.days || 30 })
      .then((response) => {
        if (!cancelled) {
          setData(response);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.response?.data?.detail || err.message || "Erreur de chargement");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [period, user]);

  const chartData = useMemo(() => (data?.sales_chart || []).map((point) => ({
    label: point.day,
    value: Number(point.total) || 0,
  })), [data]);

  const productData = data?.top_products || [];
  const categoryData = data?.category_breakdown || [];
  const statusData = Object.entries(data?.status_distribution || {}).map(([status, value]) => ({
    name: STATUS_META[status]?.label || status,
    value,
    color: STATUS_META[status]?.color || PIE_COLORS[0],
  }));
  const totalStatusOrders = statusData.reduce((sum, item) => sum + item.value, 0);
  const cancelledOrders = data?.status_distribution?.cancelled || 0;
  const orders = data?.kpi?.orders || 0;
  const validOrders = Math.max(orders - cancelledOrders, 0);
  const validationRate = orders ? Math.round((validOrders / orders) * 100) : 0;
  const conversionRate = Number(data?.kpi?.conversion_rate || 0).toFixed(1);
  const averageRevenue = chartData.length
    ? chartData.reduce((sum, point) => sum + point.value, 0) / chartData.length
    : 0;
  const maxProductRevenue = Math.max(...productData.map((product) => Number(product.revenue) || 0), 1);

  if (authLoading || loading || !data) {
    return (
      <SellerShell pendingCount={0}>
        <div className="mx-auto max-w-3xl space-y-4 px-4 pt-6">
          <div className="h-40 animate-pulse rounded-2xl bg-gray-200" />
          <div className="grid grid-cols-2 gap-3"><div className="h-32 animate-pulse rounded-2xl bg-gray-200" /><div className="h-32 animate-pulse rounded-2xl bg-gray-200" /></div>
          <div className="h-72 animate-pulse rounded-2xl bg-gray-200" />
        </div>
      </SellerShell>
    );
  }

  if (error) {
    return (
      <SellerShell seller={data?.seller} pendingCount={data?.metrics?.pending_orders || 0}>
        <div className="mx-auto max-w-2xl px-4 pt-8 text-center text-sm text-red-500">{error}</div>
      </SellerShell>
    );
  }

  return (
    <SellerShell seller={data.seller} pendingCount={data.metrics?.pending_orders || 0}>
      <div className="mx-auto max-w-3xl space-y-4">
        <header className="bg-[#111827] px-5 pb-7 pt-7 text-white sm:rounded-b-2xl sm:px-7">
          <div className="mb-6 flex items-center justify-between">
            <Link to="/dashboard" aria-label="Retour au tableau de bord" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
              <ChevronLeftIcon size={18} />
            </Link>
            <h1 className="text-base font-bold">Statistiques</h1>
            <div className="flex items-center gap-1 rounded-full bg-white/10 p-1" aria-label="Type de graphique">
              <button type="button" aria-label="Afficher les barres" onClick={() => setView("bar")} className={`rounded-full p-1.5 ${view === "bar" ? "bg-white/20" : "text-white/50"}`}>
                <BarChartIcon size={15} />
              </button>
              <button type="button" aria-label="Afficher la repartition" onClick={() => setView("pie")} className={`rounded-full p-1.5 ${view === "pie" ? "bg-white/20" : "text-white/50"}`}>
                <CircleIcon size={15} />
              </button>
            </div>
          </div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/50">Revenus</p>
          <p className="text-4xl font-bold tracking-tight sm:text-5xl">{formatXOF(data.kpi.revenue)}</p>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <BarChartIcon size={13} className="text-[#C99F08]" />
            <span className="font-bold text-[#C99F08]">{formatAverage(averageRevenue)} moy. / jour</span>
            <span className="text-white/30">·</span>
            <span className="text-white/50">{PERIODS.find((item) => item.key === period)?.label}</span>
          </div>
          <div className="mt-5 flex gap-1 rounded-full bg-black/20 p-1">
            {PERIODS.map((item) => (
              <button key={item.key} type="button" onClick={() => setPeriod(item.key)} className={`flex-1 rounded-full px-3 py-1.5 text-xs font-bold transition ${period === item.key ? "bg-[#C99F08] text-white" : "text-white/50 hover:text-white"}`}>
                {item.label}
              </button>
            ))}
          </div>
        </header>

        <div className="space-y-4 px-4 sm:px-0">
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={CheckIcon} iconClass="text-emerald-500" label="Taux de validation" value={`${validationRate}%`} detail={`${validOrders} validees · ${cancelledOrders} annulee${cancelledOrders > 1 ? "s" : ""}`}>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${validationRate}%` }} /></div>
            </StatCard>
            <StatCard icon={TrendingUpIcon} iconClass="text-[#C99F08]" label="Taux de conversion" value={`${conversionRate}%`} detail={`${orders} commandes sur la periode`}>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[#C99F08]" style={{ width: `${Math.min(Number(conversionRate) * 10, 100)}%` }} /></div>
            </StatCard>
          </div>

          {view === "bar" ? (
            <section className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-5 flex items-center justify-between">
                <div><h2 className="text-sm font-bold text-gray-900">Evolution du chiffre d'affaires</h2><p className="mt-1 text-xs text-gray-400">Revenus par jour</p></div>
                <span className="text-xs font-bold text-gray-400">{chartData.length} jours actifs</span>
              </div>
              <div className="h-60">
                {chartData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 10, right: 4, bottom: 0, left: -18 }} barSize={Math.max(8, Math.min(28, 560 / chartData.length))}>
                  <XAxis dataKey="label" tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} interval={chartData.length > 14 ? Math.ceil(chartData.length / 7) - 1 : 0} />
                  <YAxis tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(201,159,8,0.08)" }} />
                  <Bar dataKey="value" radius={[5, 5, 0, 0]} fill="#C99F08" />
                </BarChart></ResponsiveContainer> : <p className="flex h-full items-center justify-center text-sm text-gray-400">Aucune vente sur cette periode.</p>}
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm sm:p-5">
              <h2 className="mb-4 text-sm font-bold text-gray-900">Repartition des commandes</h2>
              {statusData.length ? <div className="flex items-center gap-4"><div className="h-40 w-40 shrink-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" innerRadius={42} outerRadius={65} paddingAngle={2}>{statusData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="min-w-0 flex-1 space-y-2">{statusData.map((item) => <div key={item.name} className="flex items-center gap-2 text-xs"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><span className="flex-1 truncate text-gray-600">{item.name}</span><span className="font-bold text-gray-900">{totalStatusOrders ? Math.round((item.value / totalStatusOrders) * 100) : 0}%</span></div>)}</div></div> : <p className="py-12 text-center text-sm text-gray-400">Aucune commande sur cette periode.</p>}
            </section>
          )}

          <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-black/[0.04] px-4 py-3"><h2 className="text-sm font-bold text-gray-900">Par produit</h2><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Top {productData.length}</span></div>
            {productData.length ? productData.map((product, index) => {
              const revenue = Number(product.revenue) || 0;
              return <div key={product.id || product.name} className="border-b border-black/[0.04] px-4 py-3.5 last:border-0"><div className="mb-2 flex items-center gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FEF9E7] text-[10px] font-bold text-[#8B6604]">{index + 1}</span><p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">{product.name}</p><p className="text-sm font-bold text-gray-900">{formatXOF(revenue)}</p></div><div className="flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[#C99F08]" style={{ width: `${(revenue / maxProductRevenue) * 100}%` }} /></div><span className="w-16 text-right text-[10px] text-gray-400">{product.quantity} vente{product.quantity > 1 ? "s" : ""}</span></div></div>;
            }) : <p className="py-8 text-center text-sm text-gray-400">Aucun produit vendu sur cette periode.</p>}
          </section>

          {categoryData.length > 0 && <section className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm"><div className="mb-3 flex items-center gap-2"><AlertCircleIcon className="h-4 w-4 text-[#C99F08]" /><h2 className="text-sm font-bold text-gray-900">Ventes par categorie</h2></div><div className="grid gap-2 sm:grid-cols-2">{categoryData.map((category) => <div key={category.name} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs"><span className="font-medium text-gray-600">{category.name}</span><span className="font-bold text-gray-900">{formatXOF(category.total)}</span></div>)}</div></section>}
        </div>
      </div>
    </SellerShell>
  );
}
