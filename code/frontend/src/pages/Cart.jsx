import { Link, useNavigate } from "react-router";
import QuantityStepper from "../components/QuantityStepper.jsx";
import { useAuth } from "../context/useAuth.js";
import { useCart } from "../context/useCart.js";
import { formatXof } from "../utils/format.js";

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  const goToCheckout = () => {
    if (isAuthenticated) {
      navigate("/commande");
      return;
    }

    navigate("/compte", {
      state: {
        from: "/commande",
        authMessage: "Créez un compte ou connectez-vous pour finaliser votre commande.",
      },
    });
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-16 text-center">
        <div className="h-24 w-24 rounded-full bg-brand-pale" />
        <p className="mt-6 text-lg font-medium text-ink">Votre panier est vide</p>
        <p className="mt-1 text-sm text-muted">Parcourez le catalogue pour ajouter des articles.</p>
        <Link
          to="/catalogue"
          className="mt-6 rounded-lg bg-brand px-6 py-3 font-semibold text-ink transition hover:bg-brand-dark"
        >
          Voir le catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-28 lg:pb-10">
      <h1 className="text-2xl font-bold text-ink">
        Mon panier{" "}
        <span className="text-base font-normal text-muted">
          ({itemCount} article{itemCount > 1 ? "s" : ""})
        </span>
      </h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <ul className="flex flex-col gap-4">
          {items.map((item) => (
            <li key={item.slug} className="flex gap-4 rounded-xl border border-black/10 bg-white p-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-brand-pale sm:h-28 sm:w-28">
                {item.image && (
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{item.name}</p>
                    {item.size && item.size !== "UNIQUE" && (
                      <span className="mt-1 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-muted">
                        Taille : {item.size}
                      </span>
                    )}
                    <div className="mt-2 flex items-center gap-1 text-xs text-green-700">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
                      </svg>
                      En stock - livraison 24h
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.slug)}
                    aria-label="Retirer l'article"
                    className="rounded p-1 text-muted transition hover:bg-red-50 hover:text-red-600"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-9 0 1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12" />
                    </svg>
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-lg font-bold text-ink">{formatXof(item.price_xof * item.quantity)}</p>
                  <div className="flex items-center gap-2">
                    {item.unit === "metre" && <span className="text-xs text-muted">mètres :</span>}
                    <QuantityStepper
                      quantity={item.quantity}
                      onChange={(quantity) => updateQuantity(item.slug, quantity)}
                    />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-ink">Récapitulatif</h2>
            <div className="mt-4 space-y-2 border-b border-black/10 pb-4 text-sm">
              <div className="flex justify-between text-muted">
                <span>Sous-total</span>
                <span className="font-medium text-ink">{formatXof(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Livraison</span>
                <span className="font-medium text-ink">À choisir</span>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-brand-light p-3 text-xs font-medium text-brand-dark">
              Les frais sont calculés selon le quartier à l'étape livraison.
            </div>
            <div className="mt-5 flex justify-between text-lg font-bold text-ink">
              <span>Total articles</span>
              <span>{formatXof(subtotal)}</span>
            </div>
            <button
              type="button"
              onClick={goToCheckout}
              className="mt-5 w-full rounded-lg bg-brand px-6 py-3.5 font-semibold text-white transition hover:bg-brand-medium"
            >
              Passer la commande
            </button>
            <Link
              to="/catalogue"
              className="mt-3 block text-center text-sm font-medium text-brand-dark transition hover:underline"
            >
              Continuer mes achats
            </Link>
            <div className="mt-4 flex items-center gap-2 border-t border-black/10 pt-4 text-xs text-muted">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
              </svg>
              Paiement 100% sécurisé - MTN - Moov - Visa
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white p-4 md:hidden">
        <div className="mb-2 flex items-center justify-between text-sm font-medium text-ink">
          <span>Total articles</span>
          <span className="font-bold">{formatXof(subtotal)}</span>
        </div>
        <button
          type="button"
          onClick={goToCheckout}
          className="w-full rounded-lg bg-brand px-6 py-3.5 font-semibold text-white"
        >
          Passer la commande
        </button>
      </div>
    </div>
  );
}
