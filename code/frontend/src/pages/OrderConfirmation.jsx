import { Link, useLocation, useNavigate } from "react-router";
import { useEffect } from "react";

export default function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderNumber = location.state?.orderNumber;

  useEffect(() => {
    if (!orderNumber) navigate("/", { replace: true });
  }, [orderNumber, navigate]);

  if (!orderNumber) return null;

  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
        </svg>
      </div>
      <h1 className="mt-6 text-xl font-bold text-ink">Commande confirmée</h1>
      <p className="mt-2 text-sm text-muted">Numéro de commande</p>
      <p className="text-lg font-semibold text-ink">{orderNumber}</p>
      <p className="mt-4 max-w-xs text-sm text-muted">
        Un récapitulatif de votre commande vous sera envoyé par SMS ou WhatsApp.
      </p>
      <Link
        to="/"
        className="mt-8 rounded-lg bg-brand px-6 py-3 font-semibold text-ink transition hover:bg-brand-dark"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
