import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { checkPaymentStatus, initiatePayment } from "../api/payments.js";
import { ONLINE_PAYMENT_METHODS } from "../constants/payments.js";
import { useAuth } from "../context/useAuth.js";
import { useCart } from "../context/useCart.js";
import { extractErrorMessage } from "../utils/apiError.js";
import { openFedapayCheckout } from "../utils/fedapay.js";
import Seo from "../components/Seo.jsx";
import { formatXof } from "../utils/format.js";
import { buildWhatsappUrl } from "../utils/whatsappPhone.js";

// tone détermine l'icône/couleur : "success" (coche, paiement confirmé),
// "pending" (horloge, en attente ou non finalisé), "failed" (croix, refusé/échoué).
const PAYMENT_CONTENT = {
  approved: {
    tone: "success",
    title: "Commande confirmée",
    message: "Paiement confirmé.",
  },
  pending: {
    tone: "pending",
    title: "Commande enregistrée",
    message: "Paiement en attente de confirmation.",
  },
  declined: {
    tone: "failed",
    title: "Paiement refusé",
    message: "Le paiement a été refusé — vous pouvez réessayer ou choisir un autre moyen de paiement.",
  },
  canceled: {
    tone: "failed",
    title: "Paiement annulé",
    message: "Le paiement a été annulé.",
  },
  closed: {
    tone: "pending",
    title: "Paiement non finalisé",
    message: "La fenêtre de paiement a été fermée avant la fin — votre commande est enregistrée mais le paiement n'est pas confirmé.",
  },
  timeout: {
    tone: "pending",
    title: "Paiement non finalisé",
    message: "Le délai d'attente du paiement a expiré — votre commande est enregistrée mais le paiement n'est pas confirmé.",
  },
  failed: {
    tone: "failed",
    title: "Commande enregistrée — paiement à finaliser",
    message: "Le paiement n'a pas pu être confirmé automatiquement — vous serez contacté pour finaliser le règlement.",
  },
  cash_on_delivery: {
    tone: "success",
    title: "Commande enregistrée",
    message: "Votre paiement sera effectué à la livraison.",
  },
};

const TONE_STYLES = {
  success: { badge: "bg-brand", stroke: "var(--color-ink)", path: "m5 13 4 4L19 7" },
  pending: { badge: "bg-amber-100", stroke: "var(--color-warning-dark)", path: "M12 7v5l3 2 M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" },
  failed: { badge: "bg-red-100", stroke: "var(--color-error-dark)", path: "M6 6l12 12M18 6 6 18" },
};

const RETRYABLE_STATUSES = ["declined", "canceled", "closed", "timeout", "failed"];

// Polling du statut FedaPay tant que le paiement n'est pas finalisé : le
// webhook peut mettre quelques secondes à arriver, on resynchronise via
// /payments/status/{id}/ jusqu'à obtenir un statut terminal.
const POLL_INTERVAL_MS = 5000;
const POLLABLE_STATUSES = ["pending", "closed", "timeout"];

export default function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const {
    orderId,
    orderDetails,
    shopSlug,
    total,
    method: initialMethod,
    paymentId,
    whatsappPhone,
    whatsappMessage,
  } = location.state ?? {};

  const [paymentStatus, setPaymentStatus] = useState(location.state?.paymentStatus);
  const [retryMethod, setRetryMethod] = useState(initialMethod ?? ONLINE_PAYMENT_METHODS[0].value);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState(null);

  useEffect(() => {
    if (!orderId) navigate("/", { replace: true });
  }, [orderId, navigate]);

  // Resynchronisation du statut FedaPay si le webhook n'est pas encore arrivé.
  useEffect(() => {
    if (!paymentId || !isAuthenticated || !POLLABLE_STATUSES.includes(paymentStatus)) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const payment = await checkPaymentStatus(paymentId);
        if (cancelled || payment.status === paymentStatus) return;
        setPaymentStatus(payment.status);
        if (payment.status === "approved") clearCart();
      } catch {
        // Réseau/401 : on laisse l'affichage en l'état, le prochain tick réessaiera.
      }
    };

    poll();
    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [paymentId, isAuthenticated, paymentStatus, clearCart]);

  if (!orderId) return null;

  const whatsappUrl = buildWhatsappUrl(whatsappPhone, whatsappMessage);

  const content = PAYMENT_CONTENT[paymentStatus] ?? PAYMENT_CONTENT.pending;
  const style = TONE_STYLES[content.tone];
  const isRetryable = RETRYABLE_STATUSES.includes(paymentStatus);

  const handleRetry = async () => {
    setRetryError(null);
    setRetrying(true);

    try {
      const payment = await initiatePayment({ order_id: orderId, method: retryMethod });
      let newStatus;
      if (payment.payment_url) {
        newStatus = await openFedapayCheckout(payment);
      } else {
        newStatus = payment.status;
      }
      if (newStatus === "approved") clearCart();
      setPaymentStatus(newStatus);
    } catch (err) {
      setRetryError(extractErrorMessage(err));
    } finally {
      setRetrying(false);
    }
  };

  const handlePayOnDelivery = async () => {
    setRetryError(null);
    setRetrying(true);
    try {
      await initiatePayment({ order_id: orderId, method: "cash_on_delivery" });
      clearCart();
      setPaymentStatus("cash_on_delivery");
    } catch (err) {
      setRetryError(extractErrorMessage(err));
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-16 text-center">
      <Seo title={content.title} path="/confirmation" type="website" />
      <div className={`flex h-16 w-16 items-center justify-center rounded-full ${style.badge}`}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={style.stroke} strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d={style.path} />
        </svg>
      </div>
      {orderDetails ? (
        <div className="mt-6 w-full max-w-2xl rounded-xl border border-black/10 bg-white p-6 text-left">
          <h1 className="text-xl font-bold text-ink">{content.title}</h1>
          <p className="mt-2 text-base text-muted">
            Votre commande <span className="font-bold text-ink">{orderDetails.reference || `#CMD-${String(orderId).padStart(6, "0")}`}</span> a bien été enregistrée.
          </p>

          <div className="mt-6 space-y-3 text-base">
            {orderDetails.items?.map((item) => (
              <div key={item.id} className="flex justify-between gap-4">
                <span className="text-muted">{item.product_name}</span>
                <span className="font-bold text-ink">{item.quantity}</span>
              </div>
            ))}
            {orderDetails.delivery_zone && (
              <div className="flex justify-between gap-4">
                <span className="text-muted">Zone de livraison</span>
                <span className="font-bold text-ink">{orderDetails.delivery_zone.name}</span>
              </div>
            )}
            {orderDetails.delivery_zone && (
              <div className="flex justify-between gap-4">
                <span className="text-muted">Frais de livraison</span>
                <span className="font-bold text-ink">{formatXof(orderDetails.delivery_zone.fee_xof)}</span>
              </div>
            )}
            <div className="flex justify-between gap-4 border-t border-black/10 pt-3 text-xl font-bold text-ink">
              <span>Total</span>
              <span>{formatXof(orderDetails.total_xof ?? total)}</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <h1 className="mt-6 text-xl font-bold text-ink">{content.title}</h1>
          <p className="mt-2 text-sm text-muted">Numéro de commande</p>
          <p className="text-lg font-semibold text-ink">ANW-{orderId}</p>
          {typeof total === "number" && (
            <p className="mt-1 text-sm text-muted">Total : {formatXof(total)}</p>
          )}
          <p className="mt-4 max-w-xs text-sm text-muted">{content.message}</p>
          <p className="mt-2 max-w-xs text-sm text-muted">
            Un récapitulatif de votre commande vous sera envoyé par SMS ou WhatsApp.
          </p>
        </>
      )}

      {whatsappUrl && (
        <div className={`${orderDetails ? "mt-6 w-full max-w-2xl" : "mt-6 w-full max-w-xs"}`}>
          <p className="text-sm text-muted">
            Une question sur votre commande ? Contactez directement le vendeur.
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-green-700"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Contacter le vendeur sur WhatsApp
          </a>
        </div>
      )}

      {isRetryable && (
        <div className="mt-6 w-full max-w-xs">
          <div className="flex flex-col gap-2">
            {ONLINE_PAYMENT_METHODS.map((method) => (
              <button
                key={method.value}
                type="button"
                onClick={() => setRetryMethod(method.value)}
                className={`rounded-lg border px-4 py-2 text-left text-sm ${
                  retryMethod === method.value
                    ? "border-brand bg-brand-light text-ink"
                    : "border-black/10 text-ink"
                }`}
              >
                <span className="font-medium">{method.label}</span>
              </button>
            ))}
          </div>

          {retryError && <p role="alert" className="mt-3 text-sm text-red-600">{retryError}</p>}

          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="mt-4 w-full rounded-lg bg-brand px-6 py-3 font-semibold text-ink transition hover:bg-brand-dark disabled:bg-gray-200 disabled:text-gray-400"
          >
            {retrying ? "En attente du paiement…" : "Réessayer le paiement"}
          </button>
          <button
            type="button"
            onClick={handlePayOnDelivery}
            disabled={retrying}
            className="mt-3 w-full rounded-lg border border-brand px-6 py-3 font-semibold text-ink transition hover:bg-brand-light disabled:border-gray-200 disabled:text-gray-400"
          >
            Payer à la livraison à la place
          </button>
        </div>
      )}

      <Link
        to={shopSlug ? `/${shopSlug}` : "/"}
        className="mt-8 rounded-lg bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-medium"
      >
        {shopSlug ? "Retour à la boutique" : "Retour à l'accueil"}
      </Link>
    </div>
  );
}
