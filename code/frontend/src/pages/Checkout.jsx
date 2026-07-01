import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useCart } from "../context/CartContext.jsx";
import { formatXof } from "../utils/format.js";

const DELIVERY_SLOTS = [
  { value: "matin", label: "Matin" },
  { value: "soir", label: "Soir" },
];

const PAYMENT_METHODS = [
  { value: "mtn", label: "MTN Mobile Money" },
  { value: "moov", label: "Moov Money" },
  { value: "card", label: "Carte Visa / Mastercard" },
];

function generateOrderNumber() {
  return `ANW-${Date.now().toString().slice(-6)}`;
}

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [neighborhood, setNeighborhood] = useState("");
  const [notes, setNotes] = useState("");
  const [slot, setSlot] = useState("matin");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mtn");

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium text-ink">Votre panier est vide</p>
        <Link
          to="/catalogue"
          className="mt-6 inline-block rounded-lg bg-brand px-6 py-3 font-semibold text-ink transition hover:bg-brand-dark"
        >
          Voir le catalogue
        </Link>
      </div>
    );
  }

  const canPay = neighborhood.trim() !== "" && phone.trim() !== "";

  const handlePay = (event) => {
    event.preventDefault();
    if (!canPay) return;
    const orderNumber = generateOrderNumber();
    clearCart();
    navigate("/commande/confirmation", { state: { orderNumber } });
  };

  return (
    <form onSubmit={handlePay} className="mx-auto max-w-xl pb-28 md:pb-0">
      <h1 className="text-xl font-bold text-ink">Récapitulatif de commande</h1>

      <ul className="mt-4 divide-y divide-gray-200 rounded-lg border border-gray-200">
        {items.map((item) => (
          <li key={item.slug} className="flex justify-between px-4 py-3 text-sm">
            <span className="text-ink">
              {item.name} × {item.quantity}
            </span>
            <span className="font-medium text-ink">{formatXof(item.price_xof * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-right text-base font-semibold text-ink">
        Total : {formatXof(subtotal)}
      </p>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-ink">Adresse de livraison</h2>
        <label className="mt-3 block text-sm text-ink">
          Quartier (Cotonou)
          <input
            type="text"
            value={neighborhood}
            onChange={(event) => setNeighborhood(event.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </label>
        <label className="mt-3 block text-sm text-ink">
          Indications complémentaires
          <input
            type="text"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </label>

        <div className="mt-3">
          <p className="text-sm text-ink">Créneau de livraison</p>
          <div className="mt-2 flex gap-2">
            {DELIVERY_SLOTS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSlot(option.value)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                  slot === option.value ? "bg-brand text-ink" : "border border-gray-300 text-ink"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6">
        <label className="block text-sm text-ink">
          Téléphone
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
            placeholder="+229 ..."
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </label>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-ink">Moyen de paiement</h2>
        <div className="mt-2 flex flex-col gap-2">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.value}
              type="button"
              onClick={() => setPaymentMethod(method.value)}
              className={`rounded-lg border px-4 py-3 text-left text-sm font-medium ${
                paymentMethod === method.value
                  ? "border-brand bg-brand-light text-ink"
                  : "border-gray-300 text-ink"
              }`}
            >
              {method.label}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-8 hidden md:block">
        <button
          type="submit"
          disabled={!canPay}
          className="w-full rounded-lg bg-brand px-6 py-3 font-semibold text-ink transition hover:bg-brand-dark disabled:bg-gray-200 disabled:text-gray-400"
        >
          Payer {formatXof(subtotal)}
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white p-4 md:hidden">
        <button
          type="submit"
          disabled={!canPay}
          className="w-full rounded-lg bg-brand px-6 py-3 font-semibold text-ink disabled:bg-gray-200 disabled:text-gray-400"
        >
          Payer {formatXof(subtotal)}
        </button>
      </div>
    </form>
  );
}
