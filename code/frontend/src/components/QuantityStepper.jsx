export default function QuantityStepper({ quantity, onChange, min = 1, className = "" }) {
  return (
    <div className={`inline-flex items-center overflow-hidden rounded-lg border border-black/20 ${className}`}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, quantity - 1))}
        disabled={quantity <= min}
        className="flex h-10 w-10 items-center justify-center text-lg text-ink transition hover:bg-gray-50 disabled:text-gray-300"
        aria-label="Diminuer la quantité"
      >
        −
      </button>
      <span className="flex h-10 min-w-10 items-center justify-center border-x border-black/10 text-sm font-semibold">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        className="flex h-10 w-10 items-center justify-center text-lg text-ink transition hover:bg-gray-50"
        aria-label="Augmenter la quantité"
      >
        +
      </button>
    </div>
  );
}
