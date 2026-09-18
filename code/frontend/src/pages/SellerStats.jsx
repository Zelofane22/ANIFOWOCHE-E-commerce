import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  AlertCircleIcon,
  BarChartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
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

function getMonthBounds(reference) {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  return {
    date_from: first.toISOString().slice(0, 10),
    date_to: last.toISOString().slice(0, 10),
  };
}

function formatMonthLabel(date) {
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
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

function ProGate({ locked, children }) {
  if (!locked) return children;
  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[3px] opacity-60">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/40">
        <Link
          to="/plan"
          className="inline-flex items-center gap-2 rounded-full bg-[#C99F08] px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-[#A67C06]"
        >
          Débloquer les statistiques avancées avec Pro
        </Link>
      </div>
    </div>
  );
}

export default function SellerStats() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [view, setView] = useState("bar");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, navigate, user]);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    const { date_from, date_to } = getMonthBounds(currentMonth);
    // Keep previous data visible while loading next month
    getSellerDashboard({ date_from, date_to })
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
  }, [currentMonth, user]);

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX < 0) {
        goToNextMonth();
      } else {
        goToPreviousMonth();
      }
    }
  }, [goToNextMonth, goToPreviousMonth]);

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
  const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const DAY_FULL = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  const activity = data?.activity;
  const weekdayData = (activity?.by_weekday || []).map((value, i) => ({ label: DAY_LABELS[i], value, peak: i === activity.peak_weekday }));
  const hourData = (activity?.by_hour || []).map((value, h) => ({ label: `${h}h`, value, peak: h === activity.peak_hour }));
  const hasActivity = activity && activity.peak_hour !== null;

  const plan = data?.seller?.plan ?? "FREE";
  const hasAdvancedStats = plan === "PRO" || plan === "BUSINESS";

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
        <header
          className="bg-[#111827] px-5 pb-7 pt-7 text-white sm:rounded-b-2xl sm:px-7"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="mb-6 flex items-center justify-between">
            <Link to="/dashboard" aria-label="Retour au tableau de bord" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
              <ChevronLeftIcon size={18} />
            </Link>
            <div className="text-center">
              <h1 className="text-base font-bold">Statistiques</h1>
              <Link to="/reports" className="text-[11px] font-semibold text-[#C99F08] transition hover:text-[#A67C06]">
                Rapports &amp; exports →
              </Link>
            </div>

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
            <span className="text-white/50">{formatMonthLabel(currentMonth)}</span>
          </div>
          <div className="mt-5 flex items-center justify-between">
            <button type="button" aria-label="Mois precedent" onClick={goToPreviousMonth} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
              <ChevronLeftIcon size={16} />
            </button>
            <p className="text-sm font-bold capitalize">{formatMonthLabel(currentMonth)}</p>
            <button type="button" aria-label="Mois suivant" onClick={goToNextMonth} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
              <ChevronRightIcon size={16} />
            </button>
          </div>
        </header>

        <div className="space-y-4 px-4 sm:px-0">
          <ProGate locked={!hasAdvancedStats}>
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={CheckIcon} iconClass="text-emerald-500" label="Taux de validation" value={`${validationRate}%`} detail={`${validOrders} validees · ${cancelledOrders} annulee${cancelledOrders > 1 ? "s" : ""}`}>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${validationRate}%` }} /></div>
              </StatCard>
              <StatCard icon={TrendingUpIcon} iconClass="text-[#C99F08]" label="Taux de conversion" value={`${conversionRate}%`} detail={`${orders} commandes sur la periode`}>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[#C99F08]" style={{ width: `${Math.min(Number(conversionRate) * 10, 100)}%` }} /></div>
              </StatCard>
            </div>
          </ProGate>

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
            <ProGate locked={!hasAdvancedStats}>
              <section className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm sm:p-5">
                <h2 className="mb-4 text-sm font-bold text-gray-900">Repartition des commandes</h2>
                {statusData.length ? <div className="flex items-center gap-4"><div className="h-40 w-40 shrink-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" innerRadius={42} outerRadius={65} paddingAngle={2}>{statusData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="min-w-0 flex-1 space-y-2">{statusData.map((item) => <div key={item.name} className="flex items-center gap-2 text-xs"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><span className="flex-1 truncate text-gray-600">{item.name}</span><span className="font-bold text-gray-900">{totalStatusOrders ? Math.round((item.value / totalStatusOrders) * 100) : 0}%</span></div>)}</div></div> : <p className="py-12 text-center text-sm text-gray-400">Aucune commande sur cette periode.</p>}
              </section>
            </ProGate>
          )}

          <ProGate locked={!hasAdvancedStats}>
            <section className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm sm:p-5">
              <h2 className="text-sm font-bold text-gray-900">Heures et jours de forte activité</h2>
              <p className="mt-1 mb-4 text-xs text-gray-400">
                {hasActivity ? `Pic : ${DAY_FULL[activity.peak_weekday]} vers ${activity.peak_hour}h` : "Pas assez de commandes sur cette période."}
              </p>
              {hasActivity && (<>
                <div className="h-32"><ResponsiveContainer width="100%" height="100%"><BarChart data={weekdayData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                  <XAxis dataKey="label" tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [`${v} commande(s)`, ""]} cursor={{ fill: "rgba(201,159,8,0.08)" }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>{weekdayData.map((d) => <Cell key={d.label} fill={d.peak ? "#C99F08" : "#E5D9A8"} />)}</Bar>
                </BarChart></ResponsiveContainer></div>
                <div className="mt-4 h-32"><ResponsiveContainer width="100%" height="100%"><BarChart data={hourData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                  <XAxis dataKey="label" interval={3} tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [`${v} commande(s)`, ""]} cursor={{ fill: "rgba(201,159,8,0.08)" }} />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]}>{hourData.map((d) => <Cell key={d.label} fill={d.peak ? "#C99F08" : "#E5D9A8"} />)}</Bar>
                </BarChart></ResponsiveContainer></div>
              </>)}
            </section>
          </ProGate>

          <ProGate locked={!hasAdvancedStats}>
            <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-black/[0.04] px-4 py-3"><h2 className="text-sm font-bold text-gray-900">Par produit</h2><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Top {productData.length}</span></div>
              {productData.length ? productData.map((product, index) => {
                const revenue = Number(product.revenue) || 0;
                return <div key={product.id || product.name} className="border-b border-black/[0.04] px-4 py-3.5 last:border-0"><div className="mb-2 flex items-center gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FEF9E7] text-[10px] font-bold text-[#8B6604]">{index + 1}</span><p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">{product.name}</p><p className="text-sm font-bold text-gray-900">{formatXOF(revenue)}</p></div><div className="flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[#C99F08]" style={{ width: `${(revenue / maxProductRevenue) * 100}%` }} /></div><span className="w-16 text-right text-[10px] text-gray-400">{product.quantity} vente{product.quantity > 1 ? "s" : ""}</span></div></div>;
              }) : <p className="py-8 text-center text-sm text-gray-400">Aucun produit vendu sur cette periode.</p>}
            </section>
          </ProGate>

          {categoryData.length > 0 && (
            <ProGate locked={!hasAdvancedStats}>
              <section className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2"><AlertCircleIcon className="h-4 w-4 text-[#C99F08]" /><h2 className="text-sm font-bold text-gray-900">Ventes par categorie</h2></div>
                <div className="grid gap-2 sm:grid-cols-2">{categoryData.map((category) => <div key={category.name} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs"><span className="font-medium text-gray-600">{category.name}</span><span className="font-bold text-gray-900">{formatXOF(category.total)}</span></div>)}</div>
              </section>
            </ProGate>
          )}
        </div>
      </div>
    </SellerShell>
  );
}
