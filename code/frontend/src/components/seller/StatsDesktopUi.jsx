import { Link } from "react-router";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatXof } from "../../utils/format.js";
import { LockIcon, ZapIcon } from "../icons.jsx";

// Briques d'interface partagées par les vues desktop Statistiques et Rapports.
// Style repris de DashboardDesktop (cartes blanches, bordure fine, KPI à icône teintée).

const TONES = {
  brand: "bg-brand-light text-brand-dark",
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
  violet: "bg-violet-50 text-violet-700",
};

const GOLD = "#C99F08";
const GOLD_SOFT = "#E5D9A8";

export function KpiCard({ label, value, sub, icon: Icon, tone = "brand", progress = null, progressClass = "bg-brand" }) {
  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[13px] font-semibold text-muted">{label}</p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${TONES[tone]}`}>
          <Icon size={19} />
        </span>
      </div>
      <p className="mt-2.5 truncate text-[28px] font-extrabold leading-tight text-ink">{value}</p>
      {sub && <p className="mt-2 truncate text-xs font-medium text-[#9CA3AF]">{sub}</p>}
      {progress != null && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div className={`h-full rounded-full ${progressClass}`} style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
        </div>
      )}
    </div>
  );
}

export function Card({ title, subtitle, aside, children, className = "", bodyClassName = "p-6" }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-black/[0.07] bg-white ${className}`}>
      <div className={bodyClassName}>
        {(title || aside) && (
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              {title && <h2 className="text-base font-bold text-ink">{title}</h2>}
              {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
            </div>
            {aside}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export function ProGateDesktop({ locked, children, className = "" }) {
  if (!locked) return <div className={className}>{children}</div>;
  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none h-full select-none opacity-60 blur-[3px]" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/40 p-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm">
          <LockIcon size={13} />
          Offre Pro
        </span>
      </div>
    </div>
  );
}

function MoneyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-[#111827] px-2.5 py-1.5 text-center shadow-lg">
      <p className="text-[11px] font-semibold text-[#9CA3AF]">{label}</p>
      <p className="text-xs font-bold text-white">{formatXof(payload[0].value)}</p>
    </div>
  );
}

function CountTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="rounded-lg bg-[#111827] px-2.5 py-1.5 text-center shadow-lg">
      <p className="text-[11px] font-semibold text-[#9CA3AF]">{label}</p>
      <p className="text-xs font-bold text-white">
        {value} commande{value > 1 ? "s" : ""}
      </p>
    </div>
  );
}

export function RevenueBars({ data, height = 280 }) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-[#F9F9FB] text-sm text-[#9CA3AF]"
        style={{ height }}
      >
        Aucune vente sur cette période.
      </div>
    );
  }
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 4, bottom: 0, left: -12 }}
          barSize={Math.max(8, Math.min(32, 720 / data.length))}
        >
          <XAxis
            dataKey="label"
            tick={{ fill: "#9CA3AF", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={data.length > 16 ? Math.ceil(data.length / 10) - 1 : 0}
          />
          <YAxis
            tick={{ fill: "#9CA3AF", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${Math.round(value / 1000)}k`}
          />
          <Tooltip content={<MoneyTooltip />} cursor={{ fill: "rgba(201,159,8,0.08)" }} />
          <Bar dataKey="value" radius={[5, 5, 0, 0]} fill={GOLD} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ActivityBars({ data, interval = 0, height = 180 }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <XAxis dataKey="label" interval={interval} tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CountTooltip />} cursor={{ fill: "rgba(201,159,8,0.08)" }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.label} fill={d.peak ? GOLD : GOLD_SOFT} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopProductsCard({ products, title = "Top produits", className = "" }) {
  const maxRevenue = Math.max(...products.map((p) => Number(p.revenue) || 0), 1);
  return (
    <section className={`min-w-0 overflow-hidden rounded-2xl border border-black/[0.07] bg-white ${className}`}>
      <div className="flex items-center gap-3 px-6 pt-5 pb-3.5">
        <h2 className="flex-1 text-base font-bold text-ink">{title}</h2>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">Top {products.length}</span>
      </div>
      {products.length === 0 ? (
        <p className="border-t border-black/[0.06] px-6 py-10 text-center text-sm text-[#9CA3AF]">
          Aucun produit vendu sur cette période.
        </p>
      ) : (
        <table className="w-full table-fixed text-left">
          <thead className="bg-[#F4F4F8] text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
            <tr>
              <th className="w-12 py-2.5 pl-6 font-bold">#</th>
              <th className="py-2.5 font-bold">Produit</th>
              <th className="hidden w-[26%] py-2.5 font-bold xl:table-cell">Part du CA</th>
              <th className="w-[13%] py-2.5 text-right font-bold">Ventes</th>
              <th className="w-[22%] py-2.5 pr-6 text-right font-bold">Revenus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.06]">
            {products.map((product, index) => {
              const revenue = Number(product.revenue) || 0;
              return (
                <tr key={product.id || product.name}>
                  <td className="py-3 pl-6">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-light text-[11px] font-bold text-brand-dark">
                      {index + 1}
                    </span>
                  </td>
                  <td className="truncate py-3 pr-3 text-sm font-semibold text-ink" title={product.name}>
                    {product.name}
                  </td>
                  <td className="hidden py-3 pr-4 xl:table-cell">
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${(revenue / maxRevenue) * 100}%` }} />
                    </div>
                  </td>
                  <td className="py-3 text-right text-[13px] text-muted">{product.quantity}</td>
                  <td className="whitespace-nowrap py-3 pr-6 text-right text-sm font-bold text-ink">{formatXof(revenue)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}

export function CategoriesCard({ categories, className = "" }) {
  const total = categories.reduce((sum, c) => sum + (Number(c.total) || 0), 0);
  return (
    <Card title="Ventes par catégorie" subtitle={`${categories.length} catégorie${categories.length > 1 ? "s" : ""}`} className={className}>
      {categories.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#9CA3AF]">Aucune vente par catégorie sur cette période.</p>
      ) : (
        <ul className="space-y-3.5">
          {categories.map((category) => {
            const value = Number(category.total) || 0;
            const pct = total ? Math.round((value / total) * 100) : 0;
            return (
              <li key={category.name}>
                <div className="flex items-center gap-2 text-[13px]">
                  <span className="min-w-0 flex-1 truncate font-semibold text-ink">{category.name}</span>
                  <span className="whitespace-nowrap font-bold text-ink">{formatXof(value)}</span>
                  <span className="w-10 text-right text-xs text-[#9CA3AF]">{pct}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// Bandeau unique d'incitation à passer en Pro (au lieu d'un bouton par bloc verrouillé).
export function ProUpsellBanner({ text }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-brand/30 bg-brand-light px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
          <ZapIcon size={16} />
        </span>
        <p className="text-sm font-medium text-gray-800">{text}</p>
      </div>
      <Link
        to="/plan"
        className="shrink-0 rounded-[10px] bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark"
      >
        Passer à Pro
      </Link>
    </div>
  );
}
