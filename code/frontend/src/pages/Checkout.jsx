import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getAddresses } from "../api/addresses.js";
import { createDelivery, fetchDeliverySlots, fetchDeliveryZones } from "../api/delivery.js";
import { createOrder } from "../api/orders.js";
import { initiatePayment } from "../api/payments.js";
import { useAuth } from "../context/useAuth.js";
import { useCart } from "../context/useCart.js";
import { extractErrorMessage } from "../utils/apiError.js";
import { formatXof } from "../utils/format.js";

const PAYMENT_METHODS = [
  { value: "mtn", label: "MTN Mobile Money", detail: "Paiement mobile instantané", badge: "MTN" },
  { value: "moov", label: "Moov Money", detail: "Paiement mobile sécurisé", badge: "MOOV" },
  { value: "card", label: "Carte Visa / Mastercard", detail: "Carte bancaire internationale", badge: "VISA" },
];

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [zones, setZones] = useState([]);
  const [slots, setSlots] = useState([]);
  const [zoneId, setZoneId] = useState(null);
  const [slotId, setSlotId] = useState(null);
  const [loadingDeliveryOptions, setLoadingDeliveryOptions] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [step, setStep] = useState(1);

  const [fullName, setFullName] = useState(user?.username ?? "");
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mtn");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading || isAuthenticated) return;
    navigate("/compte", {
      replace: true,
      state: {
        from: "/commande",
        authMessage: "Créez un compte ou connectez-vous pour finaliser votre commande.",
      },
    });
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
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
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    getAddresses()
      .then((data) => setSavedAddresses(data.results ?? data))
      .catch(() => {});
  }, [isAuthenticated]);

  const applySavedAddress = (addressId) => {
    const address = savedAddresses.find((item) => String(item.id) === addressId);
    if (!address) return;
    setZoneId(address.zone);
    setPhone(address.phone);
    setFullName(address.full_name);
    setNotes(address.notes);
  };

  if (authLoading || !isAuthenticated) {
    return <p className="px-4 py-10 text-center text-muted">Chargement…</p>;
  }

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

  const selectedZone = zones.find((option) => option.id === zoneId);
  const selectedSlot = slots.find((option) => option.id === slotId);
  const deliveryFee = selectedZone?.fee_xof ?? 0;
  const total = subtotal + deliveryFee;
  const canPay =
    fullName.trim() !== "" &&
    phone.trim() !== "" &&
    zoneId != null &&
    slotId != null &&
    !submitting &&
    !loadingDeliveryOptions;

  const canContinueToPayment =
    fullName.trim() !== "" &&
    phone.trim() !== "" &&
    zoneId != null &&
    slotId != null &&
    !loadingDeliveryOptions;

  const handlePay = async (event) => {
    event.preventDefault();
    if (!canPay) return;
    setError(null);
    setSubmitting(true);

    const zone = selectedZone;
    const slot = selectedSlot;
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

      let orderTotal = order.total_xof;
      try {
        await createDelivery({ order_id: order.id, zone_id: zoneId, slot_id: slotId });
        orderTotal += deliveryFee;
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
        state: { orderId: order.id, total: orderTotal, paymentStatus },
      });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-black/15 px-4 py-3 text-sm text-ink placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15";

  return (
    <form onSubmit={handlePay} className="mx-auto max-w-7xl px-4 py-6 pb-28 lg:pb-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted">
        <button type="button" onClick={() => navigate("/panier")} className="font-medium transition hover:text-brand-dark">
          Panier
        </button>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
        </svg>
        <span className={step === 1 ? "font-semibold text-brand-dark" : "font-medium text-ink"}>Livraison</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
        </svg>
        <span className={step === 2 ? "font-semibold text-brand-dark" : ""}>Paiement</span>
      </div>

      {error && <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          {step === 1 && (
            <>
              <h1 className="text-xl font-bold text-ink">Adresse de livraison</h1>

              <div className="mt-5 space-y-4">
                <label className="block text-sm font-semibold text-ink">
                  Nom complet
                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                    className={inputClass}
                  />
                </label>

                {savedAddresses.length > 0 && (
                  <label className="block text-sm font-semibold text-ink">
                    Utiliser une adresse enregistrée
                    <select
                      defaultValue=""
                      onChange={(event) => applySavedAddress(event.target.value)}
                      className={inputClass}
                    >
                      <option value="">Sélectionner une adresse</option>
                      {savedAddresses.map((address) => (
                        <option key={address.id} value={address.id}>
                          {address.label || address.zone_name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="block text-sm font-semibold text-ink">
                  Quartier / Zone à Cotonou
                  {loadingDeliveryOptions ? (
                    <p className="mt-2 rounded-lg border border-black/10 px-4 py-3 text-sm font-normal text-muted">
                      Chargement des zones de livraison…
                    </p>
                  ) : (
                    <select
                      value={zoneId ?? ""}
                      onChange={(event) => setZoneId(Number(event.target.value))}
                      required
                      className={inputClass}
                    >
                      {zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name}
                          {zone.fee_xof > 0 ? ` (+${formatXof(zone.fee_xof)})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </label>

                <label className="block text-sm font-semibold text-ink">
                  Indications complémentaires
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={3}
                    placeholder="Bâtiment, étage, repère proche..."
                    className={`${inputClass} resize-none`}
                  />
                </label>

                <label className="block text-sm font-semibold text-ink">
                  Téléphone (SMS + WhatsApp)
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    required
                    placeholder="+229 01 XX XX XX XX"
                    className={inputClass}
                  />
                  <span className="mt-1.5 block text-xs font-normal text-muted">
                    Vous recevrez un SMS de confirmation sous 1h.
                  </span>
                </label>
              </div>

              <div className="mt-6">
                <p className="text-sm font-semibold text-ink">Créneau de livraison</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSlotId(slot.id)}
                      className={`rounded-[10px] border-2 px-3 py-4 text-center transition ${
                        slotId === slot.id
                          ? "border-brand bg-brand-light"
                          : "border-black/10 bg-white hover:border-black/25"
                      }`}
                    >
                      <span className="block text-sm font-semibold text-ink">{slot.label}</span>
                      <span className="mt-1 block text-xs text-muted">
                        {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={!canContinueToPayment}
                onClick={() => setStep(2)}
                className="mt-6 w-full rounded-lg bg-brand px-6 py-3.5 font-semibold text-white transition hover:bg-brand-medium disabled:bg-gray-200 disabled:text-gray-400"
              >
                Continuer vers le paiement
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-xl font-bold text-ink">Moyen de paiement</h1>
              <div className="mt-5 space-y-3">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMethod(method.value)}
                    className={`flex w-full items-center gap-4 rounded-[10px] border-2 px-4 py-4 text-left transition ${
                      paymentMethod === method.value
                        ? "border-brand bg-brand-light"
                        : "border-black/10 bg-white hover:border-black/20"
                    }`}
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ink text-xs font-bold text-white">
                      {method.badge}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink">{method.label}</span>
                      <span className="block text-xs text-muted">{method.detail}</span>
                    </span>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        paymentMethod === method.value ? "border-brand bg-brand" : "border-black/20"
                      }`}
                    >
                      {paymentMethod === method.value && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
                        </svg>
                      )}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-6 rounded-[10px] border border-brand/20 bg-brand-light p-4 text-sm text-brand-dark">
                Paiement sécurisé. Aucune donnée bancaire n'est stockée par ANIFOWOCHE.
              </div>

              <div className="mt-6 hidden gap-3 md:flex">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-lg border border-black/20 px-6 py-3.5 font-semibold text-ink transition hover:border-brand"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={!canPay}
                  className="min-w-0 flex-1 rounded-lg bg-brand px-6 py-3.5 font-semibold text-white transition hover:bg-brand-medium disabled:bg-gray-200 disabled:text-gray-400"
                >
                  {submitting ? "Traitement…" : `Payer ${formatXof(total)}`}
                </button>
              </div>
            </>
          )}
        </div>

        <aside>
          <div className="sticky top-24 rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-ink">Votre commande</h2>
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <div key={item.slug} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-brand-pale">
                    {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                    <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-charcoal px-1 text-[10px] font-bold text-white">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink">{item.name}</p>
                    {item.size && item.size !== "UNIQUE" && <p className="text-xs text-muted">Taille {item.size}</p>}
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-ink">
                    {formatXof(item.price_xof * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-black/10 pt-4 text-sm">
              <div className="flex justify-between text-muted">
                <span>Sous-total</span>
                <span className="text-ink">{formatXof(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Livraison</span>
                {deliveryFee > 0 ? (
                  <span className="text-ink">{formatXof(deliveryFee)}</span>
                ) : (
                  <span className="font-medium text-green-700">Gratuite</span>
                )}
              </div>
              <div className="flex justify-between border-t border-black/10 pt-3 text-base font-bold text-ink">
                <span>Total</span>
                <span>{formatXof(total)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {step === 2 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white p-4 md:hidden">
          <button
            type="submit"
            disabled={!canPay}
            className="w-full rounded-lg bg-brand px-6 py-3.5 font-semibold text-white disabled:bg-gray-200 disabled:text-gray-400"
          >
            {submitting ? "Traitement…" : `Payer ${formatXof(total)}`}
          </button>
        </div>
      )}
    </form>
  );
}
