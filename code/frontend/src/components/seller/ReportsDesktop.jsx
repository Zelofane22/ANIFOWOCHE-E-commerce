import {
  DollarSignIcon,
  PackageIcon,
  ShoppingBagIcon,
  TrendingUpIcon,
} from "../icons.jsx";
import { formatXof } from "../../utils/format.js";
import { Card, CategoriesCard, KpiCard, RevenueBars, TopProductsCard } from "./StatsDesktopUi.jsx";

const inputClass =
  "w-full rounded-[10px] border border-black/[0.12] px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none";

/**
 * Vue desktop (>= lg) de la page Rapports.
 * Les données, la période et l'export restent gérés par SellerReports.
 */
export default function ReportsDesktop({
  periodLabel,
  kpi,
  metrics,
  chartData,
  topProducts,
  categories,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onResetDates,
  error,
}) {
  const orders = kpi?.orders || 0;
  const pending = metrics?.pending_orders || 0;

  return (
    <div className="space-y-6 px-8 pt-7 pb-8">
      {error && (
        <p role="alert" className="rounded-2xl bg-red-50 px-5 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-4 gap-5">
        <KpiCard
          label="Chiffre d'affaires"
          value={formatXof(kpi?.revenue)}
          sub={periodLabel}
          icon={DollarSignIcon}
          tone="brand"
        />
        <KpiCard
          label="Commandes"
          value={orders}
          sub={`${kpi?.conversion_rate ?? 0}% validées`}
          icon={ShoppingBagIcon}
          tone="blue"
        />
        <KpiCard
          label="Panier moyen"
          value={formatXof(kpi?.avg_order_value)}
          sub={`sur ${orders} commande${orders > 1 ? "s" : ""}`}
          icon={TrendingUpIcon}
          tone="amber"
        />
        <KpiCard
          label="Produits actifs"
          value={metrics?.products || 0}
          sub={`${pending} commande${pending > 1 ? "s" : ""} en attente`}
          icon={PackageIcon}
          tone="emerald"
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_360px] items-start gap-5">
        <Card title="Évolution du chiffre d'affaires" subtitle={`Revenus par jour · ${periodLabel}`}>
          <RevenueBars data={chartData} height={300} />
        </Card>

        <div className="space-y-5">
          <Card title="Période personnalisée" subtitle="Remplace la période choisie en haut de page">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
                Du
                <input type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} className={inputClass} />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
                Au
                <input type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} className={inputClass} />
              </label>
            </div>
            {(dateFrom || dateTo) && (
              <button
                type="button"
                onClick={onResetDates}
                className="mt-3 w-full rounded-[10px] border border-black/[0.08] px-4 py-2 text-sm font-bold text-ink transition hover:bg-gray-50"
              >
                Réinitialiser
              </button>
            )}
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_360px] items-start gap-5">
        <TopProductsCard products={topProducts} />
        <CategoriesCard categories={categories} />
      </div>
    </div>
  );
}
