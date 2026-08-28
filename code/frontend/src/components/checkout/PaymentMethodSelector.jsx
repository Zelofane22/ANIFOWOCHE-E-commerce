import { PAYMENT_METHODS } from "../../constants/payments.js";

export default function PaymentMethodSelector({
  isAuthenticated,
  storeStatus,
  setPaymentMethod,
  effectivePaymentMethodValue,
  isSelectedMethodOffline,
  waitingForPayment,
  onBack,
  canPay,
  getSubmitLabel,
}) {
  const isMethodDisabled = (method) => {
    if (!isAuthenticated && method.type !== "offline") return true;
    if (!method || method.type === "offline") return false;
    const paymentMethodsStatus = storeStatus?.payment_methods ?? {};
    if (storeStatus?.online_payment_enabled === false) return true;
    if (method.value === "mtn") return paymentMethodsStatus.mtn === false && paymentMethodsStatus.moov === false;
    return paymentMethodsStatus[method.value] === false;
  };

  return (
    <>
      <h1 className="text-xl font-bold text-ink">Moyen de paiement</h1>
      <div className="mt-5 space-y-3">
        {PAYMENT_METHODS.map((method) => {
          const disabled = isMethodDisabled(method);
          const selected = effectivePaymentMethodValue === method.value;
          return (
            <button
              key={method.value}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (!disabled) setPaymentMethod(method.value);
              }}
              className={`flex w-full items-center gap-4 rounded-[10px] border-2 px-4 py-4 text-left transition ${
                disabled
                  ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-75"
                  : selected
                    ? "border-brand bg-brand-light"
                    : "border-black/10 bg-white hover:border-black/20"
              }`}
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  disabled ? "bg-gray-300 text-gray-600" : "bg-ink text-white"
                }`}
              >
                {method.badge}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-semibold ${disabled ? "text-gray-500" : "text-ink"}`}>
                  {method.label}
                </span>
                <span className={`block text-xs ${disabled ? "text-gray-500" : "text-muted"}`}>
                  {method.detail}
                </span>
                {disabled && (
                  <span className="mt-1 block text-xs font-medium text-gray-500">
                    Ce mode de paiement est indisponible pour le moment.
                  </span>
                )}
              </span>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  selected && !disabled ? "border-brand bg-brand" : "border-black/20"
                }`}
              >
                {selected && !disabled && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
                  </svg>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {!isAuthenticated && (
        <div className="flex items-start gap-3 rounded-[10px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <p className="font-semibold">Connectez-vous pour payer en ligne</p>
            <p className="mt-1 text-xs">
              Créez un compte ou connectez-vous pour utiliser le Mobile Money et la carte bancaire.
              Vous pouvez toutefois commander et payer à la livraison.
            </p>
            <div className="mt-2 flex gap-2">
              <a href="/compte" className="inline-block rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700">
                Se connecter
              </a>
              <a href="/inscription" className="inline-block rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100">
                Créer un compte
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-[10px] border border-brand/20 bg-brand-light p-4 text-sm text-brand-dark">
        {isSelectedMethodOffline
          ? "Votre commande sera préparée et le paiement sera effectué à la livraison."
          : "Paiement sécurisé. Aucune donnée bancaire n'est stockée par ANIFOWOCHE."}
      </div>

      {waitingForPayment && (
        <p aria-live="polite" className="mt-4 rounded-lg bg-brand-pale px-4 py-3 text-sm text-brand-dark">
          Vous allez être redirigé vers notre partenaire de paiement sécurisé FedaPay. Votre panier est conservé.
        </p>
      )}

      <div className="mt-6 hidden gap-3 md:flex">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-black/20 px-6 py-3.5 font-semibold text-ink transition hover:border-brand"
        >
          Retour
        </button>
        <button
          type="submit"
          disabled={!canPay}
          className="min-w-0 flex-1 rounded-lg bg-brand px-6 py-3.5 font-semibold text-white transition hover:bg-brand-medium disabled:bg-gray-200 disabled:text-gray-400"
        >
          {getSubmitLabel()}
        </button>
      </div>
    </>
  );
}
