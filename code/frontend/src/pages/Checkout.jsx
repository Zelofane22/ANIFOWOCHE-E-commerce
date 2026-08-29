import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getAddresses } from "../api/addresses.js";
import { createDelivery, fetchDeliverySlots, fetchDeliveryZones } from "../api/delivery.js";
import { createOrder } from "../api/orders.js";
import { initiatePayment } from "../api/payments.js";
import { fetchStoreStatus } from "../api/store.js";
import { PAYMENT_METHODS } from "../constants/payments.js";
import { useAuth } from "../context/useAuth.js";
import { useCart } from "../context/useCart.js";
import { extractErrorMessage } from "../utils/apiError.js";
import { openFedapayCheckout } from "../utils/fedapay.js";
import { formatXof } from "../utils/format.js";
import Seo from "../components/Seo.jsx";
import CheckoutSteps from "../components/checkout/CheckoutSteps.jsx";
import ShippingForm from "../components/checkout/ShippingForm.jsx";
import PaymentMethodSelector from "../components/checkout/PaymentMethodSelector.jsx";
import CheckoutSummary from "../components/checkout/CheckoutSummary.jsx";

const DEFAULT_STORE_STATUS = {
  maintenance_mode: false,
  online_payment_enabled: true,
  payment_methods: { mtn: true, moov: true, card: true, cash_on_delivery: true },
};

const isPaymentMethodDisabled = (method, storeStatus) => {
  if (!method || method.type === "offline") return false;
  const paymentMethodsStatus = storeStatus?.payment_methods ?? {};
  if (storeStatus?.online_payment_enabled === false) return true;
  if (method.value === "mtn") return paymentMethodsStatus.mtn === false && paymentMethodsStatus.moov === false;
  return paymentMethodsStatus[method.value] === false;
};

const cartItemSignature = (item) =>
  JSON.stringify([
    item.id,
    item.slug,
    item.quantity,
    item.price_xof,
    item.colorName || "",
    item.colorHex || "",
    item.selectedOptions || [],
    item.deliveryMethod || "delivery",
  ]);

export default function Checkout() {
  const { items, subtotal, clearCart, reconcileCart } = useCart();
  const initialCartRef = useRef(items);

  useEffect(() => {
    reconcileCart();
  }, [reconcileCart]);
  const [cartAdjustmentNotice, setCartAdjustmentNotice] = useState(false);

  useEffect(() => {
    const initialItems = initialCartRef.current;
    const adjusted =
      initialItems.length !== items.length ||
      initialItems.some((item, index) => cartItemSignature(item) !== cartItemSignature(items[index]));
    if (adjusted) setCartAdjustmentNotice(true);
  }, [items]);
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [zones, setZones] = useState([]);
  const [slots, setSlots] = useState([]);
  const [zoneId, setZoneId] = useState(null);
  const [slotId, setSlotId] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [loadingDeliveryOptions, setLoadingDeliveryOptions] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [step, setStep] = useState(1);

  const [fullName, setFullName] = useState(user?.username ?? "");
  const [notes, setNotes] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const [storeStatus, setStoreStatus] = useState(null);
  const [error, setError] = useState(null);

  const isMaintenanceMode = storeStatus?.maintenance_mode === true;

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [showCouponField, setShowCouponField] = useState(false);

  useEffect(() => {
    if (authLoading) return;
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
  }, [authLoading]);

  useEffect(() => {
    if (!isAuthenticated) return;
    getAddresses()
      .then((data) => setSavedAddresses(data.results ?? data))
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    fetchStoreStatus()
      .then(setStoreStatus)
      .catch(() => setStoreStatus(DEFAULT_STORE_STATUS));
  }, [authLoading]);

  const isMethodDisabled = (method) => {
    if (!isAuthenticated && method.type !== "offline") return true;
    return isPaymentMethodDisabled(method, storeStatus);
  };

  const applySavedAddress = (addressId) => {
    const address = savedAddresses.find((item) => String(item.id) === addressId);
    if (!address) return;
    setZoneId(address.zone);
    setPhone(address.phone);
    setFullName(address.full_name);
    setNotes(address.notes);
  };

  const deliveryItems = items.filter((item) => (item.deliveryMethod || "delivery") === "delivery");
  const pickupItems = items.filter((item) => (item.deliveryMethod || "delivery") === "pickup");
  const hasDeliveryItems = deliveryItems.length > 0;

  const selectedZone = zones.find((option) => option.id === zoneId);
  const selectedSlot = slots.find((option) => option.id === slotId);
  const deliveryFee = hasDeliveryItems ? (selectedZone?.fee_xof ?? 0) : 0;
  const discountAmount = appliedCoupon ? Math.round((subtotal * appliedCoupon.discount_percent) / 100) : 0;
  const total = subtotal - discountAmount + deliveryFee;
  const selectedPaymentMethod = PAYMENT_METHODS.find((method) => method.value === paymentMethod);
  const effectivePaymentMethod =
    selectedPaymentMethod && !isMethodDisabled(selectedPaymentMethod)
      ? selectedPaymentMethod
      : PAYMENT_METHODS.find((method) => !isMethodDisabled(method));
  const effectivePaymentMethodValue = effectivePaymentMethod?.value ?? paymentMethod;
  const isSelectedMethodOffline = effectivePaymentMethod?.type === "offline";

  const canContinueToPayment =
    !isMaintenanceMode &&
    fullName.trim() !== "" &&
    phone.trim() !== "" &&
    (!hasDeliveryItems || (zoneId != null && slotId != null)) &&
    !loadingDeliveryOptions;

  const canPay =
    !isMaintenanceMode &&
    canContinueToPayment &&
    !!effectivePaymentMethod &&
    !submitting &&
    !loadingDeliveryOptions;

  const handlePay = async (event) => {
    event.preventDefault();
    if (!canPay) return;
    setError(null);
    setSubmitting(true);

    const zone = selectedZone;
    const slot = selectedSlot;
    const addressParts = hasDeliveryItems
      ? [zone?.name, addressLine.trim(), "créneau : " + slot?.label, notes.trim()].filter(Boolean)
      : [notes.trim()].filter(Boolean);
    const address = addressParts.join(" — ");

    try {
      const order = await createOrder({
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: user?.email ?? "",
        address: hasDeliveryItems ? address : "",
        city: "Cotonou",
        ...(coordinates ?? {}),
        coupon_code: appliedCoupon?.code ?? "",
        items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          color_name: item.colorName || "",
          color_hex: item.colorHex || "",
          selected_options: item.selectedOptions || [],
          delivery_method: item.deliveryMethod || "delivery",
        })),
      });

      let orderTotal = order.total_xof;
      if (hasDeliveryItems) {
        try {
          await createDelivery({ order_id: order.id, zone_id: zoneId, slot_id: slotId });
          orderTotal += deliveryFee;
        } catch {
          // La commande reste valide même si l'enregistrement de la livraison échoue ;
        }
      }

      let paymentStatus = "cash_on_delivery";
      let paymentId = null;
      if (!isSelectedMethodOffline) {
        paymentStatus = "failed";
        try {
          const payment = await initiatePayment({ order_id: order.id, method: effectivePaymentMethodValue });
          paymentId = payment.id;
          if (payment.payment_url) {
            setWaitingForPayment(true);
            paymentStatus = await openFedapayCheckout(payment);
          } else {
            paymentStatus = payment.status;
          }
        } catch {
          paymentStatus = "failed";
        }
      } else {
        await initiatePayment({ order_id: order.id, method: effectivePaymentMethodValue });
      }

      if (paymentStatus === "approved" || paymentStatus === "cash_on_delivery") clearCart();
      navigate("/commande/confirmation", {
        state: {
          orderId: order.id,
          total: orderTotal,
          paymentStatus,
          method: effectivePaymentMethodValue,
          paymentId,
        },
      });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setWaitingForPayment(false);
      setSubmitting(false);
    }
  };

  const getSubmitLabel = () => {
    if (isMaintenanceMode) return "Boutique en maintenance";
    if (waitingForPayment) return "En attente du paiement…";
    if (submitting) return "Traitement…";
    return isSelectedMethodOffline ? `Commander ${formatXof(total)}` : `Payer ${formatXof(total)}`;
  };

  if (authLoading) {
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

  return (
    <form onSubmit={handlePay} className="mx-auto max-w-7xl px-4 py-6 pb-28 lg:pb-10">
      <Seo title="Commande" path="/commande" type="website" />
      <CheckoutSteps currentStep={step} />

      {isMaintenanceMode && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0 text-amber-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.3 3.3 10.3a2 2 0 0 0 0 2.8l7 7a2 2 0 0 0 2.8 0l7-7a2 2 0 0 0 0-2.8l-7-7a2 2 0 0 0-2.8 0Z" />
          </svg>
          <span>
            Boutique temporairement en maintenance — aucune nouvelle commande ne peut être passée pour le moment. Merci de revenir plus tard.
          </span>
        </div>
      )}

      {cartAdjustmentNotice && (
        <p role="alert" className="mb-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Un ou plusieurs articles de votre panier ont été mis à jour (stock ou prix). Vérifiez votre commande avant de continuer.
        </p>
      )}

      {error && (
        <p role="alert" className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          {step === 1 && (
            <ShippingForm
              isAuthenticated={isAuthenticated}
              zones={zones}
              slots={slots}
              loadingDeliveryOptions={loadingDeliveryOptions}
              savedAddresses={savedAddresses}
              zoneId={zoneId}
              setZoneId={setZoneId}
              slotId={slotId}
              setSlotId={setSlotId}
              coordinates={coordinates}
              setCoordinates={setCoordinates}
              locating={locating}
              setLocating={setLocating}
              locationError={locationError}
              setLocationError={setLocationError}
              fullName={fullName}
              setFullName={setFullName}
              phone={phone}
              setPhone={setPhone}
              addressLine={addressLine}
              setAddressLine={setAddressLine}
              notes={notes}
              setNotes={setNotes}
              applySavedAddress={applySavedAddress}
              canContinueToPayment={canContinueToPayment}
              onContinue={() => setStep(2)}
              hasDeliveryItems={hasDeliveryItems}
            />
          )}

          {step === 2 && (
            <PaymentMethodSelector
              isAuthenticated={isAuthenticated}
              storeStatus={storeStatus}
              setPaymentMethod={setPaymentMethod}
              effectivePaymentMethodValue={effectivePaymentMethodValue}
              isSelectedMethodOffline={isSelectedMethodOffline}
              waitingForPayment={waitingForPayment}
              onBack={() => setStep(1)}
              canPay={canPay}
              getSubmitLabel={getSubmitLabel}
            />
          )}
        </div>

        <CheckoutSummary
          items={items}
          subtotal={subtotal}
          appliedCoupon={appliedCoupon}
          setAppliedCoupon={setAppliedCoupon}
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          couponError={couponError}
          setCouponError={setCouponError}
          validatingCoupon={validatingCoupon}
          setValidatingCoupon={setValidatingCoupon}
          showCouponField={showCouponField}
          setShowCouponField={setShowCouponField}
          deliveryFee={deliveryFee}
          discountAmount={discountAmount}
          total={total}
          hasDeliveryItems={hasDeliveryItems}
          deliveryItems={deliveryItems}
          pickupItems={pickupItems}
        />
      </div>

      {step === 2 && (
        <div className="fixed inset-x-0 bottom-[calc(var(--tabbar-h)+var(--tabbar-safe))] z-20 border-t border-gray-200 bg-white p-4 md:hidden">
          <button
            type="submit"
            disabled={!canPay}
            className="w-full rounded-lg bg-brand px-6 py-3.5 font-semibold text-white disabled:bg-gray-200 disabled:text-gray-400"
          >
            {getSubmitLabel()}
          </button>
        </div>
      )}
    </form>
  );
}
