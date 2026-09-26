import { PAYMENT_METHODS } from "../../constants/payments.js";

export default function PaymentMethodSelector({
  isAuthenticated,
  storeStatus,
  allowOnlinePayment = true,
  setPaymentMethod,
  effectivePaymentMethodValue,
  isSelectedMethodOffline,
  waitingForPayment,
  onBack,
  canPay,
  getSubmitLabel,
  whatsappSellers = [],
}) {
  const isMethodDisabled = (method) => {
    if (!isAuthenticated && method.type !== "offline") return true;
    if (method.type === "online" && !allowOnlinePayment) return true;
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

      {whatsappSellers.length > 0 && (
        <div className="mt-5 rounded-[10px] border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-900">
            Commander directement sur WhatsApp
          </p>
          <p className="mt-1 text-xs text-green-800">
            Certains vendeurs ne proposent pas encore le paiement en ligne. Vous pouvez les
            contacter directement sur WhatsApp pour finaliser votre commande.
          </p>
          <div className="mt-3 space-y-2">
            {whatsappSellers.map((seller) => (
              <a
                key={seller.name + seller.url}
                href={seller.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-green-700"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Contacter {seller.name} sur WhatsApp
              </a>
            ))}
          </div>
        </div>
      )}

      {isAuthenticated && !allowOnlinePayment && (
        <div className="flex items-start gap-3 rounded-[10px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <p className="font-semibold">Paiement en ligne indisponible pour ce panier</p>
            <p className="mt-1 text-xs">
              Certains articles proviennent de vendeurs qui ne proposent pas encore le paiement en
              ligne (réservé aux boutiques Business). Vous pouvez commander et payer à la livraison.
            </p>
          </div>
        </div>
      )}

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
