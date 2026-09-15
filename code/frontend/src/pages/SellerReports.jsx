import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { exportSellerReport, getSellerDashboard } from "../api/seller.js";
import {
  BarChartIcon,
  ChevronLeftIcon,
  DownloadIcon,
  FileTextIcon,
  PackageIcon,
  ShoppingBagIcon,
  TrendingUpIcon,
} from "../components/icons.jsx";
import SellerShell from "../components/seller/SellerShell.jsx";
import { useAuth } from "../context/useAuth.js";
import { formatXof } from "../utils/format.js";
import { extractErrorMessage } from "../utils/apiError.js";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PERIODS = [
  { key: "7j", days: 7, label: "7 j" },
  { key: "30j", days: 30, label: "30 j" },
  { key: "3m", days: 90, label: "3 mois" },
];

function SummaryCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className="h-4 w-4 text-[#C99F08]" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-[#111827] px-3 py-2 text-xs text-white shadow-lg">
      <p className="text-gray-400">{label}</p>
      <p className="mt-0.5 font-bold">{formatXof(payload[0].value)}</p>
    </div>
  );
}

export default function SellerReports() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState("30j");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, navigate, user]);

  const params = useMemo(() => {
    if (dateFrom && dateTo) return { date_from: dateFrom, date_to: dateTo };
    const selected = PERIODS.find((p) => p.key === period) || PERIODS[1];
    return { period: selected.days };
  }, [period, dateFrom, dateTo]);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    getSellerDashboard(params)
      .then((response) => {
        if (!cancelled) {
          setData(response);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(extractErrorMessage(err) || "Erreur de chargement");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user, params]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      const blob = await exportSellerReport(params);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rapport-ventes-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(extractErrorMessage(err) || "Export impossible pour le moment.");
    } finally {
      setExporting(false);
    }
  }, [params]);

  if (authLoading || loading || !data) {
    return (
      <SellerShell pendingCount={0}>
        <div className="mx-auto max-w-3xl space-y-4 px-4 pt-6">
          <div className="h-36 animate-pulse rounded-2xl bg-gray-200" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-28 animate-pulse rounded-2xl bg-gray-200" />
            <div className="h-28 animate-pulse rounded-2xl bg-gray-200" />
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-gray-200" />
        </div>
      </SellerShell>
    );
  }

  const chartData = (data.sales_chart || []).map((point) => ({
    label: point.day,
    value: Number(point.total) || 0,
  }));
  const topProducts = data.top_products || [];
  const categories = data.category_breakdown || [];
  const exportedAllowed = data.seller?.limits?.features?.exports !== false;
  const maxProductRevenue = Math.max(...topProducts.map((p) => Number(p.revenue) || 0), 1);

  return (
    <SellerShell seller={data.seller} pendingCount={data.metrics?.pending_orders || 0}>
      <div className="mx-auto max-w-3xl space-y-4">
        <header className="bg-[#111827] px-5 pb-6 pt-7 text-white sm:rounded-b-2xl sm:px-7">
          <div className="mb-5 flex items-center justify-between">
            <Link
              to="/dashboard"
              aria-label="Retour au tableau de bord"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
            >
              <ChevronLeftIcon size={18} />
            </Link>
            <h1 className="text-base font-bold">Rapports</h1>
            <span className="h-9 w-9" />
          </div>

          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/50">
            Chiffre d&apos;affaires
          </p>
          <p className="text-3xl font-bold tracking-tight sm:text-4xl">{formatXof(data.kpi?.revenue)}</p>
          <p className="mt-1 text-xs text-white/50">
            {data.kpi?.orders || 0} commande{(data.kpi?.orders || 0) > 1 ? "s" : ""} · panier moyen{" "}
            {formatXof(data.kpi?.avg_order_value)}
          </p>

          <div className="mt-5 flex items-center gap-1 rounded-full bg-white/5 p-1">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => { setPeriod(p.key); setDateFrom(""); setDateTo(""); }}
                className={
                  period === p.key && !dateFrom && !dateTo
                    ? "flex-1 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white transition"
                    : "flex-1 rounded-full px-3 py-1.5 text-xs font-medium text-gray-400 transition hover:text-white"
                }
              >
                {p.label}
              </button>
            ))}
          </div>
        </header>

        <div className="space-y-4 px-4 sm:px-0">
          <div className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
            <p className="mb-3 text-sm font-bold text-gray-900">Période personnalisée</p>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
                Du
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="rounded-lg border border-black/[0.12] px-3 py-2 text-sm text-gray-900"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
                Au
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="rounded-lg border border-black/[0.12] px-3 py-2 text-sm text-gray-900"
                />
              </label>
              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => { setDateFrom(""); setDateTo(""); }}
                  className="rounded-lg border border-black/[0.12] px-3 py-2 text-sm font-semibold text-gray-600"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              icon={ShoppingBagIcon}
              label="Commandes"
              value={data.kpi?.orders || 0}
              sub={`${data.kpi?.conversion_rate ?? 0}% validées`}
            />
            <SummaryCard
              icon={PackageIcon}
              label="Produits actifs"
              value={data.metrics?.products || 0}
              sub={`${data.metrics?.pending_orders || 0} commande(s) en attente`}
            />
          </div>

          <section className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Évolution du chiffre d&apos;affaires</h2>
                <p className="mt-1 text-xs text-gray-400">Revenus par jour</p>
              </div>
              <BarChartIcon className="h-4 w-4 text-[#C99F08]" />
            </div>
            <div className="h-60">
              {chartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 4, bottom: 0, left: -18 }} barSize={Math.max(8, Math.min(28, 560 / chartData.length))}>
                    <XAxis dataKey="label" tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} interval={chartData.length > 14 ? Math.ceil(chartData.length / 7) - 1 : 0} />
                    <YAxis tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(201,159,8,0.08)" }} />
                    <Bar dataKey="value" radius={[5, 5, 0, 0]} fill="#C99F08" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="flex h-full items-center justify-center text-sm text-gray-400">
                  Aucune vente sur cette période.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-black/[0.04] px-4 py-3">
              <h2 className="text-sm font-bold text-gray-900">Top produits</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Top {topProducts.length}</span>
            </div>
            {topProducts.length ? (
              topProducts.map((product, index) => {
                const revenue = Number(product.revenue) || 0;
                return (
                  <div key={product.id || product.name} className="border-b border-black/[0.04] px-4 py-3.5 last:border-0">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FEF9E7] text-[10px] font-bold text-[#8B6604]">{index + 1}</span>
                      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">{product.name}</p>
                      <p className="text-sm font-bold text-gray-900">{formatXof(revenue)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-[#C99F08]" style={{ width: `${(revenue / maxProductRevenue) * 100}%` }} />
                      </div>
                      <span className="w-16 text-right text-[10px] text-gray-400">
                        {product.quantity} vente{product.quantity > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">Aucun produit vendu sur cette période.</p>
            )}
          </section>

          {categories.length > 0 && (
            <section className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUpIcon className="h-4 w-4 text-[#C99F08]" />
                <h2 className="text-sm font-bold text-gray-900">Ventes par catégorie</h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {categories.map((category) => (
                  <div key={category.name} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs">
                    <span className="font-medium text-gray-600">{category.name}</span>
                    <span className="font-bold text-gray-900">{formatXof(category.total)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
          )}

          <div className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
            {exportedAllowed ? (
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#C99F08] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#A67C06] disabled:opacity-60"
              >
                <DownloadIcon size={16} />
                {exporting ? "Préparation de l'export…" : "Exporter en CSV"}
              </button>
            ) : (
              <div className="text-center">
                <p className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-700">
                  <FileTextIcon size={16} className="text-[#C99F08]" />
                  L&apos;export des rapports est inclus dans les offres Pro et Business.
                </p>
                <Link
                  to="/plan"
                  className="mt-3 inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#C99F08] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#A67C06]"
                >
                  Découvrir les offres
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </SellerShell>
  );
}
