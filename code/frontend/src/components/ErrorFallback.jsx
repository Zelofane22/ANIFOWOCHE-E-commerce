export default function ErrorFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-bold text-ink">Une erreur est survenue</h1>
      <p className="max-w-sm text-sm text-muted">
        Notre équipe a été prévenue. Rechargez la page pour continuer votre visite.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-medium"
      >
        Recharger la page
      </button>
    </div>
  );
}
