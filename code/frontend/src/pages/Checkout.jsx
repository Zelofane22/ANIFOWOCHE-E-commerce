import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { createDelivery, fetchDeliverySlots, fetchDeliveryZones } from "../api/delivery.js";
import { createOrder } from "../api/orders.js";
import { initiatePayment } from "../api/payments.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { extractErrorMessage } from "../utils/apiError.js";
import { formatXof } from "../utils/format.js";

const PAYMENT_METHODS = [
  { value: "mtn", label: "MTN Mobile Money" },
  { value: "moov", label: "Moov Money" },
  { value: "card", label: "Carte Visa / Mastercard" },
];

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [zones, setZones] = useState([]);
  const [slots, setSlots] = useState([]);
  const [zoneId, setZoneId] = useState(null);
  const [slotId, setSlotId] = useState(null);
  const [loadingDeliveryOptions, setLoadingDeliveryOptions] = useState(true);

  const [fullName, setFullName] = useState(user?.username ?? "");
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mtn");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([fetchDeliveryZones(), fetchDeliverySlots()])
      .then(([zonesData, slotsData]) => {
        const zoneResults = zonesData.results ?? zonesData;
        const slotResults = slotsData.results ?? slotsData;
        setZones(zoneResults);
        setSlots(slotResults);
        setZoneId(zoneResults[0]?.id ?? null);
        setSlotId(slotResults[0]?.id ?? null);
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoadingDeliveryOptions(false));
  }, []);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
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

  const canPay =
    fullName.trim() !== "" &&
    phone.trim() !== "" &&
    zoneId != null &&
    slotId != null &&
    !submitting &&
    !loadingDeliveryOptions;

  const handlePay = async (event) => {
    event.preventDefault();
    if (!canPay) return;
    setError(null);
    setSubmitting(true);

    const zone = zones.find((option) => option.id === zoneId);
    const slot = slots.find((option) => option.id === slotId);
    const address = `${zone.name} — créneau : ${slot.label}${notes.trim() ? ` — ${notes.trim()}` : ""}`;

    try {
      const order = await createOrder({
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: user?.email ?? "",
        address,
        city: "Cotonou",
        items: items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
      });

      try {
        await createDelivery({ order_id: order.id, zone_id: zoneId, slot_id: slotId });
      } catch {
        // La commande reste valide même si l'enregistrement de la livraison échoue ;
        // elle pourra être rattachée manuellement depuis l'admin.
      }

      let paymentStatus = "failed";
      try {
        const payment = await initiatePayment({ order_id: order.id, method: paymentMethod });
        paymentStatus = payment.status;
      } catch {
        // La commande est bien enregistrée même si l'appel FedaPay échoue (sandbox indisponible).
        paymentStatus = "failed";
      }

      clearCart();
      navigate("/commande/confirmation", {
        state: { orderId: order.id, total: order.total_xof, paymentStatus },
      });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="mx-auto max-w-xl px-4 py-6 pb-28 md:pb-6">
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

      {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-ink">Vos coordonnées</h2>
        <label className="mt-3 block text-sm text-ink">
          Nom complet
          <input
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </label>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-ink">Adresse de livraison</h2>

        {loadingDeliveryOptions ? (
          <p className="mt-3 text-sm text-muted">Chargement des zones de livraison…</p>
        ) : (
          <>
            <label className="mt-3 block text-sm text-ink">
              Quartier (Cotonou)
              <select
                value={zoneId ?? ""}
                onChange={(event) => setZoneId(Number(event.target.value))}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                    {zone.fee_xof > 0 ? ` (+${formatXof(zone.fee_xof)})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-3">
              <p className="text-sm text-ink">Créneau de livraison</p>
              <div className="mt-2 flex gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSlotId(slot.id)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                      slotId === slot.id ? "bg-brand text-ink" : "border border-gray-300 text-ink"
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <label className="mt-3 block text-sm text-ink">
          Indications complémentaires
          <input
            type="text"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </label>
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
          {submitting ? "Traitement…" : `Payer ${formatXof(subtotal)}`}
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white p-4 md:hidden">
        <button
          type="submit"
          disabled={!canPay}
          className="w-full rounded-lg bg-brand px-6 py-3 font-semibold text-ink disabled:bg-gray-200 disabled:text-gray-400"
        >
          {submitting ? "Traitement…" : `Payer ${formatXof(subtotal)}`}
        </button>
      </div>
    </form>
  );
}
