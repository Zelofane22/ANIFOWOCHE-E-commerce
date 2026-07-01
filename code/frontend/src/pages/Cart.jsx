import { Link, useNavigate } from "react-router";
import QuantityStepper from "../components/QuantityStepper.jsx";
import { useCart } from "../context/CartContext.jsx";
import { formatXof } from "../utils/format.js";

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const navigate = useNavigate();

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
    <div className="mx-auto max-w-4xl px-4 py-6 pb-28 md:pb-6">
      <h1 className="text-xl font-bold text-ink">Mon panier</h1>

      <ul className="mt-4 divide-y divide-gray-200">
        {items.map((item) => (
          <li key={item.slug} className="flex gap-3 py-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-brand-pale">
              {item.image && (
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ink">{item.name}</p>
                  {item.size && item.size !== "UNIQUE" && (
                    <p className="text-xs text-muted">Taille {item.size}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.slug)}
                  aria-label="Retirer l'article"
                  className="p-1 text-muted hover:text-red-600"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-9 0 1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">{formatXof(item.price_xof)}</p>
                <QuantityStepper
                  quantity={item.quantity}
                  onChange={(quantity) => updateQuantity(item.slug, quantity)}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 hidden items-center justify-between border-t border-gray-200 pt-4 md:flex">
        <p className="text-base font-medium text-ink">
          Sous-total : <span className="font-bold">{formatXof(subtotal)}</span>
        </p>
        <button
          type="button"
          onClick={() => navigate("/commande")}
          className="rounded-lg bg-brand px-6 py-3 font-semibold text-ink transition hover:bg-brand-dark"
        >
          Valider la commande
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white p-4 md:hidden">
        <div className="mb-2 flex items-center justify-between text-sm font-medium text-ink">
          <span>Sous-total</span>
          <span className="font-bold">{formatXof(subtotal)}</span>
        </div>
        <button
          type="button"
          onClick={() => navigate("/commande")}
          className="w-full rounded-lg bg-brand px-6 py-3 font-semibold text-ink"
        >
          Valider la commande
        </button>
      </div>
    </div>
  );
}
