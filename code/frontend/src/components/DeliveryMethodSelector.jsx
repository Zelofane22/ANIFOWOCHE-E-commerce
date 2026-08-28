export default function DeliveryMethodSelector({ value, onChange, sellerAddress, name }) {
  return (
    <div className="delivery-choice rounded-lg border border-black/10 bg-white p-4">
      <p className="delivery-choice__title text-sm font-semibold text-ink mb-3">Mode de récupération</p>
      <label className="delivery-choice__label flex items-center gap-2">
        <input
          type="radio"
          name={name}
          value="delivery"
          checked={value === "delivery"}
          onChange={() => onChange("delivery")}
          className="delivery-choice__radio h-4 w-4 accent-brand"
        />
        <span className="delivery-choice__text text-sm text-ink">Livraison à domicile</span>
      </label>
      <label className="delivery-choice__label flex items-center gap-2 mt-2">
        <input
          type="radio"
          name={name}
          value="pickup"
          checked={value === "pickup"}
          onChange={() => onChange("pickup")}
          className="delivery-choice__radio h-4 w-4 accent-brand"
        />
        <span className="delivery-choice__text text-sm text-ink">Retrait chez le vendeur</span>
      </label>
      {value === "pickup" && sellerAddress && (
        <p className="delivery-choice__address mt-3 text-sm text-muted">
          Adresse de retrait : {sellerAddress}
        </p>
      )}
    </div>
  );
}
