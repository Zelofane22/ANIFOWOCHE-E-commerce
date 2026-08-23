import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  CheckIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  ZapIcon,
} from "../components/icons.jsx";
import SellerShell from "../components/seller/SellerShell.jsx";
import { useAuth } from "../context/useAuth.js";
import {
  createSellerSubscription,
  getSellerPlans,
  getSellerSubscription,
} from "../api/seller.js";
import { openFedapaySubscriptionCheckout } from "../utils/fedapay.js";
import { extractErrorMessage } from "../utils/apiError.js";

const PLAN_META = {
  FREE: { label: "Gratuit", note: "Pour démarrer et tester", color: "#6B7280" },
  STARTER: { label: "Starter", note: "Pour les vendeurs actifs", color: "#2563EB" },
  PRO: { label: "Pro", note: "Mieux vendre et piloter", color: "#C99F08" },
  BUSINESS: { label: "Business", note: "Développer son activité", color: "#7C3AED" },
};

const PLAN_ORDER = ["FREE", "STARTER", "PRO", "BUSINESS"];

const FEATURE_LABELS = {
  essential_stats: "Statistiques essentielles",
  advanced_stats: "Statistiques avancées",
  exports: "Exports des statistiques",
  team: "Multi-utilisateurs",
  promotions: "Outils promotionnels",
  client_relaunch: "Relances clients",
  custom_domain: "Domaine personnalisé",
  online_payment: "Paiement Mobile Money et carte bancaire",
  multi_store: "Produits visibles sur la vitrine principale",
  priority_support: "Support prioritaire",
  seo_listing: "Référencement SEO des produits",
  delivery_service: "Livraison prise en charge",
  marketplace_orders: "Commandes centralisées via la marketplace",
};

const FALLBACK_FEATURES = {
  FREE: [
    "5 produits",
    "5 commandes par mois",
    "Vitrine publique avec identité ANIF",
    "Bouton WhatsApp",
    "Gestion basique des commandes",
    "Statistiques de base",
  ],
  STARTER: [
    "100 produits et commandes par mois",
    "Commandes illimitées",
    "Statistiques essentielles",
  ],
  PRO: [
    "Produits et commandes illimités",
    "Statistiques avancées",
    "Exports des statistiques",
    "Multi-utilisateurs",
    "Outils promotionnels",
    "Relances clients",
  ],
  BUSINESS: [
    "Produits et commandes illimités",
    "Produits visibles sur la vitrine principale",
    "Référencement SEO",
    "Paiement Mobile Money et carte bancaire",
    "Livraison prise en charge",
    "Commandes centralisées via la marketplace",
  ],
};

function formatPrice(price) {
  if (price == null) return "Sur devis";
  return new Intl.NumberFormat("fr-FR").format(price) + " F";
}

function QuotaBar({ label, used, max }) {
  if (max == null) return null;
  const pct = used / max;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-white/60 font-medium">{label}</span>
        <span className="font-bold text-white">
          {used} / {max}
        </span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct > 0.8 ? "bg-amber-400" : "bg-[#C99F08]"}`}
          style={{ width: `${Math.min(pct * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function SellerPlan() {
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useAuth();
  const [plans, setPlans] = useState([]);
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState("PRO");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadPlans = () =>
    getSellerPlans()
      .then((res) => setPlans(res.plans || []))
      .catch(() => setPlans([]));

  const loadSubscription = () =>
    getSellerSubscription()
      .then(setData)
      .catch(() => {});

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    loadPlans();
    loadSubscription();
  }, [isAuthenticated, loading, navigate]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#F4F4F8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#C99F08] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#9CA3AF]">Chargement...</p>
        </div>
      </div>
    );
  }

  const subscription = data.subscription;
  const limits = data.limits;
  const isPending = subscription?.status === "pending";
  const isApproved = subscription?.status === "approved";
  const isFree = data.current_plan === "FREE";
  const currentPlanMeta = PLAN_META[data.current_plan];

  const handleSubscribe = async () => {
    setError("");
    setSubmitting(true);
    try {
      const sub = await createSellerSubscription(selected);
      const outcome = await openFedapaySubscriptionCheckout(sub);
      if (outcome === "completed") {
        await loadSubscription();
      }
    } catch (err) {
      setError(extractErrorMessage(err) || "Impossible de lancer le paiement.");
    } finally {
      setSubmitting(false);
    }
  };

  const isCurrentPlan = (code) => data.current_plan === code;

  const isPayable = (code) => ["STARTER", "PRO"].includes(code);
  const getFeatureLabel = (feature) => FEATURE_LABELS[feature] || feature;

  return (
    <SellerShell seller={{ display_name: "Plan" }} pendingCount={0}>
      <div className="bg-[#111827] px-5 pt-12 pb-6">
        <h1 className="text-xl font-bold text-white mb-1">Mon abonnement</h1>
        <p className="text-white/50 text-sm">Gérez votre plan et vos fonctionnalités</p>

        <div className="mt-5 bg-white/10 backdrop-blur-sm rounded-[20px] p-5 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">
                Plan actuel
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                  style={{
                    color: currentPlanMeta?.color,
                    backgroundColor: `${currentPlanMeta?.color}20`,
                  }}
                >
                  <ZapIcon size={12} />
                  {currentPlanMeta?.label || data.current_plan}
                </span>
              </div>
            </div>
            {isApproved && subscription && (
              <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400">
                Actif
              </span>
            )}
            {isPending && (
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400">
                En attente
              </span>
            )}
            {isFree && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/60">
                GRATUIT
              </span>
            )}
          </div>

          {isApproved && subscription?.ends_at && (
            <p className="text-white/40 text-xs">
              Expire le{" "}
              {new Date(subscription.ends_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}

          {isFree && limits && (
            <div className="mt-4 space-y-3">
              <QuotaBar
                label="Produits"
                used={limits.products_used || 0}
                max={limits.max_products}
              />
              {limits.max_orders_per_month != null && (
                <QuotaBar
                  label="Commandes / mois"
                  used={limits.orders_this_month || 0}
                  max={limits.max_orders_per_month}
                />
              )}
            </div>
          )}

          {isPending && subscription?.payment_url && (
            <a
              href={subscription.payment_url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center gap-2 rounded-xl bg-amber-500/15 border border-amber-400/20 px-4 py-3 text-sm text-amber-300 transition hover:bg-amber-500/25"
            >
              <ExternalLinkIcon size={14} className="flex-shrink-0" />
              <span className="font-semibold">Rouvrir la page de paiement</span>
            </a>
          )}
        </div>
      </div>

      <div className="px-4 pt-5 pb-8 max-w-lg mx-auto">
        <p className="text-sm font-bold text-[#374151] mb-3 px-1">Comparer les offres</p>

        <div className="grid gap-3 sm:grid-cols-2">
          {PLAN_ORDER.map((code) => {
            const plan = plans.find((p) => p.code === code);
            const meta = PLAN_META[code];
            const isSelected = selected === code;
            const current = isCurrentPlan(code);
            const payable = isPayable(code);
            const price = plan?.price_xof;
            const hasPromo =
              plan?.promo_price_xof != null && plan.promo_price_xof > 0;

            return (
              <button
                key={code}
                type="button"
                onClick={() => payable && setSelected(code)}
                disabled={!payable}
                className={`relative bg-white rounded-[16px] shadow-sm border p-5 text-left transition-all ${
                  isSelected
                    ? "border-[#C99F08] shadow-md ring-1 ring-[#C99F08]/20"
                    : "border-black/[0.05] hover:border-black/10"
                } ${!payable ? "opacity-80" : ""}`}
              >
                {current && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-green-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    Actuel
                  </span>
                )}
                {code === "PRO" && !current && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-[#C99F08] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    Populaire
                  </span>
                )}
                {code === "BUSINESS" && (
                  <span className="absolute -top-2.5 right-4 rounded-full bg-[#7C3AED] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    Bientôt disponible
                  </span>
                )}

                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        isSelected
                          ? "border-[#C99F08] bg-[#C99F08]"
                          : "border-black/20"
                      }`}
                    >
                      {isSelected && (
                        <CheckIcon size={11} className="text-white" />
                      )}
                    </div>
                    <h3 className="text-base font-bold text-[#111827]">
                      {meta.label}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-[#9CA3AF] mt-1 mb-3">{meta.note}</p>

                {payable && hasPromo ? (
                  <div className="mb-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-[#C99F08]">
                        {formatPrice(plan.promo_price_xof)}
                      </span>
                      <span className="text-xs text-[#9CA3AF]">/mois</span>
                    </div>
                    <p className="text-[11px] text-[#9CA3AF] mt-1">
                      {formatPrice(plan.price_xof)}/mois après{" "}
                      {plan.promo_duration_months} premiers mois
                    </p>
                  </div>
                ) : (
                  <div className="mb-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-[#111827]">
                        {formatPrice(price)}
                      </span>
                      {price != null && price > 0 && (
                        <span className="text-xs text-[#9CA3AF]">/mois</span>
                      )}
                    </div>
                  </div>
                )}

                <ul className="space-y-2">
                  {(FALLBACK_FEATURES[code] || plan?.features || []).map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-[#374151]"
                    >
                      <CheckIcon
                        size={14}
                        className="mt-0.5 shrink-0 text-[#C99F08]"
                      />
                      {getFeatureLabel(f)}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mt-4 rounded-[12px] bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 bg-white rounded-[16px] shadow-sm border border-black/[0.05] p-5">
          {isFree ? (
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={submitting || isCurrentPlan(selected) || !isPayable(selected)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#C99F08] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#A67C06] active:bg-[#8B6604] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <RefreshCwIcon size={15} className="animate-spin" />
                  Lancement du paiement…
                </>
              ) : (
                <>
                  Souscrire au plan {PLAN_META[selected]?.label}
                  <ChevronRightIcon size={16} />
                </>
              )}
            </button>
          ) : isPayable(selected) && !isCurrentPlan(selected) ? (
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#C99F08] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#A67C06] active:bg-[#8B6604] disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCwIcon size={15} className="animate-spin" />
                  Lancement du paiement…
                </>
              ) : (
                <>
                  Changer pour le plan {PLAN_META[selected]?.label}
                  <ChevronRightIcon size={16} />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-gray-200 px-5 py-3 text-sm font-bold text-gray-400 cursor-not-allowed"
            >
              {selected === "BUSINESS"
                ? "Bientôt disponible après vérification"
                : isCurrentPlan(selected)
                ? "Vous êtes déjà sur ce plan"
                : "Sélectionnez un plan payant"}
            </button>
          )}

          <p className="mt-3 text-xs leading-5 text-[#9CA3AF] text-center">
            Paiement sécurisé par FedaPay (mobile money ou carte). L'abonnement
            prend effet dès la confirmation du paiement et se renouvelle
            mensuellement.
          </p>
        </div>
      </div>
    </SellerShell>
  );
}
