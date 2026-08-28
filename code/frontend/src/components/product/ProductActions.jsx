export default function ProductActions({
  handleBuyNow,
  handleAddToCart,
  handleToggleWishlist,
  handleShare,
  wishlisted,
  added,
  shared,
  outOfStock,
  isMobile = false
}) {
  if (isMobile) {
    return (
      <div className="fixed inset-x-0 bottom-[calc(var(--tabbar-h)+var(--tabbar-safe))] z-20 flex gap-3 border-t border-black/10 bg-white p-4 md:bottom-0 lg:hidden">
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={outOfStock}
          className="min-w-0 flex-[3_1_0%] rounded-lg bg-ink px-6 py-3.5 font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {outOfStock ? "Rupture de stock" : "Acheter"}
        </button>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={outOfStock}
          className="min-w-0 flex-[1_1_0%] rounded-lg border border-brand bg-white px-3 py-3.5 font-semibold text-brand-dark disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
        >
          {added ? "✓ Ajouté !" : "Panier"}
        </button>
        <button
          type="button"
          onClick={handleToggleWishlist}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-black/20 text-muted"
          aria-label={wishlisted ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-black/20 text-muted"
          aria-label={shared ? "Lien copié" : "Partager le produit"}
        >
          {shared ? (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
            </svg>
          ) : (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path strokeLinecap="round" d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
            </svg>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-auto hidden gap-3 pt-6 lg:flex">
      <button
        type="button"
        onClick={handleBuyNow}
        disabled={outOfStock}
        className="min-w-0 flex-[3_1_0%] rounded-lg bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300"
      >
        {outOfStock ? "Rupture de stock" : "Acheter"}
      </button>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={outOfStock}
        className="min-w-0 flex-[1_1_0%] rounded-lg border border-brand px-4 py-3 text-sm font-semibold text-brand-dark transition hover:bg-brand-light active:bg-brand-medium/30 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent"
      >
        {added ? "✓ Ajouté !" : "Panier"}
      </button>
      <button
        type="button"
        onClick={handleToggleWishlist}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-black/20 text-muted transition hover:border-brand hover:text-brand-dark"
        aria-label={wishlisted ? "Retirer des favoris" : "Ajouter aux favoris"}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={handleShare}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-black/20 text-muted transition hover:border-brand hover:text-brand-dark"
        aria-label={shared ? "Lien copié" : "Partager le produit"}
      >
        {shared ? (
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
          </svg>
        ) : (
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path strokeLinecap="round" d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
          </svg>
        )}
      </button>
    </div>
  );
}
