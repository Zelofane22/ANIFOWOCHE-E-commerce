import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  CheckIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
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
  FREE: { label: "Gratuit", note: "Pour démarrer et tester" },
  STARTER: { label: "Starter", note: "Pour les vendeurs actifs" },
  PRO: { label: "Pro", note: "Mieux vendre et piloter" },
  BUSINESS: { label: "Entreprise", note: "Sur devis" },
};

function formatPrice(price) {
  if (price == null) return "Sur devis";
  return new Intl.NumberFormat("fr-FR").format(price) + " F";
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
    return <div className="min-h-screen bg-surface-muted px-4 py-10 text-center text-muted">Chargement...</div>;
  }

  const subscription = data.subscription;
  const isPending = subscription?.status === "pending";
  const isApproved = subscription?.status === "approved";
  const isFree = data.current_plan === "FREE";

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

  return (
    <SellerShell title="Abonnement" seller={{ display_name: "Plan" }}>
      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl border border-black/10 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-brand-dark">ANIF Seller</p>
              <h2 className="mt-1 text-xl font-bold text-ink">
                Plan actuel :{" "}
                <span className="text-brand-dark">
                  {PLAN_META[data.current_plan]?.label || data.current_plan}
                </span>
              </h2>
            </div>
            {isApproved && subscription && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                Actif · expire le{" "}
                {subscription.ends_at ? new Date(subscription.ends_at).toLocaleDateString("fr-FR") : "—"}
              </span>
            )}
            {isPending && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                Paiement en attente de confirmation
              </span>
            )}
          </div>

          {isPending && subscription?.payment_url && (
            <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Votre paiement est en cours de validation par FedaPay. Vous pouvez le poursuivre :
              <a
                href={subscription.payment_url}
                target="_blank"
                rel="noreferrer"
                className="ml-1 inline-flex items-center gap-1 font-bold text-amber-900 underline"
              >
                rouvrir la page de paiement <ExternalLinkIcon size={13} />
              </a>
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
          )}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {plans
            .filter((p) => ["STARTER", "PRO"].includes(p.code))
            .map((plan) => {
              const isSelected = selected === plan.code;
              const price = plan.price_xof;
              return (
                <button
                  key={plan.code}
                  type="button"
                  onClick={() => setSelected(plan.code)}
                  className={`relative rounded-xl border-2 bg-white p-5 text-left transition ${
                    isSelected ? "border-brand shadow-md" : "border-black/10 hover:border-brand/50"
                  }`}
                >
                  {plan.code === "PRO" && (
                    <span className="absolute -top-2.5 left-4 rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold text-white">
                      Populaire
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-bold text-ink">{plan.name}</h3>
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        isSelected ? "border-brand bg-brand" : "border-black/20"
                      }`}
                    >
                      {isSelected && <CheckIcon size={11} className="text-white" />}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{PLAN_META[plan.code]?.note}</p>
                  <p className="mt-3">
                    <span className="text-2xl font-bold text-ink">{formatPrice(price)}</span>
                    {price != null && price > 0 && <span className="text-sm text-muted">/mois</span>}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {(plan.features || []).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-ink">
                        <CheckIcon size={15} className="mt-0.5 shrink-0 text-brand-dark" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
        </div>

        <div className="mt-5 rounded-xl border border-black/10 bg-white p-5">
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-medium disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCwIcon size={15} className="animate-spin" />
                Lancement du paiement…
              </>
            ) : isFree ? (
              <>
                Souscrire à ce plan
                <ChevronRightIcon size={16} />
              </>
            ) : (
              <>
                Changer pour ce plan
                <ChevronRightIcon size={16} />
              </>
            )}
          </button>
          <p className="mt-3 text-xs leading-5 text-muted">
            Paiement sécurisé par FedaPay (mobile money ou carte). L'abonnement prend effet dès la
            confirmation du paiement et se renouvelle mensuellement.
          </p>
        </div>
      </div>
    </SellerShell>
  );
}
