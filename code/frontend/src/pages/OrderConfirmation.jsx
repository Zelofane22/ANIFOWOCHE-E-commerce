import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { initiatePayment } from "../api/payments.js";
import { ONLINE_PAYMENT_METHODS } from "../constants/payments.js";
import { useCart } from "../context/useCart.js";
import { extractErrorMessage } from "../utils/apiError.js";
import { waitForPaymentApproval } from "../utils/fedapay.js";
import { formatXof } from "../utils/format.js";

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
  success: { badge: "bg-brand", stroke: "#1A1A1A", path: "m5 13 4 4L19 7" },
  pending: { badge: "bg-amber-100", stroke: "#92400E", path: "M12 7v5l3 2 M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" },
  failed: { badge: "bg-red-100", stroke: "#B91C1C", path: "M6 6l12 12M18 6 6 18" },
};

const RETRYABLE_STATUSES = ["declined", "canceled", "closed", "timeout", "failed"];

export default function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { orderId, total, method: initialMethod } = location.state ?? {};

  const [paymentStatus, setPaymentStatus] = useState(location.state?.paymentStatus);
  const [retryMethod, setRetryMethod] = useState(initialMethod ?? ONLINE_PAYMENT_METHODS[0].value);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState(null);

  useEffect(() => {
    if (!orderId) navigate("/", { replace: true });
  }, [orderId, navigate]);

  if (!orderId) return null;

  const content = PAYMENT_CONTENT[paymentStatus] ?? PAYMENT_CONTENT.pending;
  const style = TONE_STYLES[content.tone];
  const isRetryable = RETRYABLE_STATUSES.includes(paymentStatus);

  const handleRetry = async () => {
    setRetryError(null);
    setRetrying(true);

    // Ouverte tout de suite, dans le geste utilisateur (clic), pour éviter le
    // blocage popup des navigateurs.
    const paymentWindow = window.open("", "fedapay_payment", "width=480,height=720");

    try {
      const payment = await initiatePayment({ order_id: orderId, method: retryMethod });
      let newStatus;
      if (payment.payment_url && paymentWindow && !paymentWindow.closed) {
        paymentWindow.location.href = payment.payment_url;
        newStatus = await waitForPaymentApproval(payment.id, paymentWindow);
      } else {
        paymentWindow?.close();
        newStatus = payment.status;
      }
      if (newStatus === "approved") clearCart();
      setPaymentStatus(newStatus);
    } catch (err) {
      paymentWindow?.close();
      setRetryError(extractErrorMessage(err));
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-16 text-center">
      <div className={`flex h-16 w-16 items-center justify-center rounded-full ${style.badge}`}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={style.stroke} strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d={style.path} />
        </svg>
      </div>
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

          {retryError && <p className="mt-3 text-sm text-red-600">{retryError}</p>}

          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="mt-4 w-full rounded-lg bg-brand px-6 py-3 font-semibold text-ink transition hover:bg-brand-dark disabled:bg-gray-200 disabled:text-gray-400"
          >
            {retrying ? "En attente du paiement…" : "Réessayer le paiement"}
          </button>
        </div>
      )}

      <Link
        to="/"
        className="mt-8 rounded-lg bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-medium"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
