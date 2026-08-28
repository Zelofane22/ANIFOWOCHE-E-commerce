import { Link } from "react-router";
import SellerStatCard from "./SellerStatCard.jsx";

export default function PlanLimitCard({ plan, limits, productsCount, ordersCount, planMeta }) {
  const productsNearLimit = plan === "FREE" && limits?.max_products != null && productsCount / limits.max_products >= 0.8;
  const ordersNearLimit = plan === "FREE" && limits?.max_orders_per_month != null && ordersCount / limits.max_orders_per_month >= 0.8;

  return (
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
          <SellerStatCard label="Produits" value={productsCount} max={limits.max_products} />
        )}
        {limits.max_orders_per_month != null && (
          <SellerStatCard label="Commandes / mois" value={ordersCount} max={limits.max_orders_per_month} />
        )}
      </div>
      {plan === "FREE" && (productsNearLimit || ordersNearLimit) ? (
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
  );
}
