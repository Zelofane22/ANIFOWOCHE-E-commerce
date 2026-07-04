import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
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
};

const TONE_STYLES = {
  success: { badge: "bg-brand", stroke: "#1A1A1A", path: "m5 13 4 4L19 7" },
  pending: { badge: "bg-amber-100", stroke: "#92400E", path: "M12 7v5l3 2 M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" },
  failed: { badge: "bg-red-100", stroke: "#B91C1C", path: "M6 6l12 12M18 6 6 18" },
};

export default function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, total, paymentStatus } = location.state ?? {};

  useEffect(() => {
    if (!orderId) navigate("/", { replace: true });
  }, [orderId, navigate]);

  if (!orderId) return null;

  const content = PAYMENT_CONTENT[paymentStatus] ?? PAYMENT_CONTENT.pending;
  const style = TONE_STYLES[content.tone];

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
      <Link
        to="/"
        className="mt-8 rounded-lg bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-medium"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
