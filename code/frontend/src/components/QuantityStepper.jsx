export default function QuantityStepper({ quantity, onChange, min = 1 }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-gray-300">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, quantity - 1))}
        disabled={quantity <= min}
        className="px-3 py-1 text-lg text-ink disabled:text-gray-300"
        aria-label="Diminuer la quantité"
      >
        −
      </button>
      <span className="min-w-8 text-center text-sm font-medium">{quantity}</span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        className="px-3 py-1 text-lg text-ink"
        aria-label="Augmenter la quantité"
      >
        +
      </button>
    </div>
  );
}
