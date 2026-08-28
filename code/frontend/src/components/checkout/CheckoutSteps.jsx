export default function CheckoutSteps({ currentStep }) {
  const steps = ["Livraison", "Paiement", "Confirmation"];

  return (
    <div className="mb-6 flex items-center gap-1 text-sm text-muted sm:gap-2">
      <button type="button" className="font-medium transition hover:text-brand-dark">Panier</button>
      <span aria-hidden="true" className="mx-1 text-black/30 sm:mx-2">/</span>
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const completed = currentStep > stepNumber;
        const active = currentStep === stepNumber;
        return (
          <div key={label} className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
            <div
              aria-current={active ? "step" : undefined}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                completed || active
                  ? "border-brand bg-brand text-white"
                  : "border-black/20 bg-white text-muted"
              }`}
            >
              {stepNumber}
            </div>
            <span className={`min-w-0 truncate ${active ? "font-semibold text-brand-dark" : completed ? "font-medium text-ink" : "text-muted"}`}>
              <span className="min-[380px]:hidden">{label === "Livraison" ? "Livr." : label === "Paiement" ? "Paiem." : "Confirm."}</span>
              <span className="hidden min-[380px]:inline">{label}</span>
            </span>
            {stepNumber < 3 && (
              <span className={`h-0.5 min-w-2 flex-1 ${currentStep > stepNumber ? "bg-brand" : "bg-black/10"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
