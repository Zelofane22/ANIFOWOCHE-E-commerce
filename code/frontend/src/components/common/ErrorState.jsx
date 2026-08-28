export default function ErrorState({ message = "Une erreur est survenue.", onRetry, retryLabel = "Réessayer", className = "px-4 py-16 text-center" }) {
  return (
    <div role="alert" className={className}>
      <p className="font-semibold text-red-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-medium"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
