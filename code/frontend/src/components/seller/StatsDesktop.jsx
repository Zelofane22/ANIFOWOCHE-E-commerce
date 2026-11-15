import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { BarChartIcon, CheckIcon, DollarSignIcon, TrendingUpIcon } from "../icons.jsx";
import { formatXof } from "../../utils/format.js";
import {
  ActivityBars,
  Card,
  CategoriesCard,
  KpiCard,
  ProGateDesktop,
  RevenueBars,
  TopProductsCard,
} from "./StatsDesktopUi.jsx";

/**
 * Vue desktop (>= lg) de la page Statistiques.
 * Toutes les données sont calculées dans SellerStats et passées en props.
 */
export default function StatsDesktop({
  monthLabel,
  revenue,
  averageRevenue,
  orders,
  validationRate,
  validOrders,
  cancelledOrders,
  conversionRate,
  chartData,
  statusData,
  totalStatusOrders,
  weekdayData,
  hourData,
  hasActivity,
  peakLabel,
  productData,
  categoryData,
  hasAdvancedStats,
}) {
  const locked = !hasAdvancedStats;

  return (
    <div className="space-y-6 px-8 pt-7 pb-8">
      <div className="grid grid-cols-4 gap-5">
        <KpiCard
          label="Revenus du mois"
          value={formatXof(revenue)}
          sub={monthLabel}
          icon={DollarSignIcon}
          tone="brand"
        />
        <KpiCard
          label="Moyenne par jour"
          value={formatXof(Math.round(averageRevenue))}
          sub={`sur ${chartData.length} jour${chartData.length > 1 ? "s" : ""} actif${chartData.length > 1 ? "s" : ""}`}
          icon={BarChartIcon}
          tone="blue"
        />
        <ProGateDesktop locked={locked} className="col-span-2">
          <div className="grid grid-cols-2 gap-5">
            <KpiCard
              label="Taux de validation"
              value={`${validationRate}%`}
              sub={`${validOrders} validée${validOrders > 1 ? "s" : ""} · ${cancelledOrders} annulée${cancelledOrders > 1 ? "s" : ""}`}
              icon={CheckIcon}
              tone="emerald"
              progress={validationRate}
              progressClass="bg-emerald-500"
            />
            <KpiCard
              label="Taux de conversion"
              value={`${conversionRate}%`}
              sub={`${orders} commande${orders > 1 ? "s" : ""} sur la période`}
              icon={TrendingUpIcon}
              tone="amber"
              progress={Number(conversionRate) * 10}
            />
          </div>
        </ProGateDesktop>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_360px] items-stretch gap-5">
        <Card
          title="Évolution du chiffre d'affaires"
          subtitle={`Revenus par jour · ${monthLabel}`}
          aside={
            <span className="whitespace-nowrap rounded-full bg-[#F4F4F8] px-2.5 py-1 text-xs font-bold text-muted">
              {chartData.length} jour{chartData.length > 1 ? "s" : ""} actif{chartData.length > 1 ? "s" : ""}
            </span>
          }
        >
          <RevenueBars data={chartData} height={280} />
        </Card>

        <ProGateDesktop locked={locked}>
          <Card title="Répartition des commandes" subtitle="Par statut sur le mois" className="h-full">
            {statusData.length ? (
              <div>
                <div className="mx-auto h-44 w-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} dataKey="value" innerRadius={50} outerRadius={78} paddingAngle={2}>
                        {statusData.map((item) => (
                          <Cell key={item.name} fill={item.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {statusData.map((item) => (
                    <li key={item.name} className="flex items-center gap-2 text-[13px]">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="min-w-0 flex-1 truncate text-muted">{item.name}</span>
                      <span className="font-semibold text-ink">{item.value}</span>
                      <span className="w-10 text-right font-bold text-ink">
                        {totalStatusOrders ? Math.round((item.value / totalStatusOrders) * 100) : 0}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-[#9CA3AF]">Aucune commande sur cette période.</p>
            )}
          </Card>
        </ProGateDesktop>
      </div>

      <ProGateDesktop locked={locked}>
        <div className="grid grid-cols-2 gap-5">
          <Card
            title="Jours de forte activité"
            subtitle={hasActivity ? `Pic : ${peakLabel}` : "Pas assez de commandes sur cette période."}
          >
            {hasActivity ? (
              <ActivityBars data={weekdayData} />
            ) : (
              <div className="flex h-[180px] items-center justify-center rounded-xl bg-[#F9F9FB] text-sm text-[#9CA3AF]">
                Aucune donnée
              </div>
            )}
          </Card>
          <Card title="Heures de forte activité" subtitle="Commandes par heure de la journée">
            {hasActivity ? (
              <ActivityBars data={hourData} interval={2} />
            ) : (
              <div className="flex h-[180px] items-center justify-center rounded-xl bg-[#F9F9FB] text-sm text-[#9CA3AF]">
                Aucune donnée
              </div>
            )}
          </Card>
        </div>
      </ProGateDesktop>

      <ProGateDesktop locked={locked}>
        <div className="grid grid-cols-[minmax(0,1fr)_360px] items-start gap-5">
          <TopProductsCard products={productData} title="Par produit" />
          <CategoriesCard categories={categoryData} />
        </div>
      </ProGateDesktop>
    </div>
  );
}
