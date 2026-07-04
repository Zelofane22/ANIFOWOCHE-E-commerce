import { Link, Navigate, useLocation } from "react-router";
import {
  AlertCircleIcon,
  CheckIcon,
  ChevronLeftIcon,
  ClockIcon,
  PackageIcon,
} from "../icons.jsx";
import { useAuth } from "../../context/useAuth.js";

export const orderRef = (id) => `ANW-${id}`;

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export const ORDER_STATUS = {
  received: { label: "Commande reçue", classes: "bg-gray-100 text-gray-600", Icon: ClockIcon },
  prepared: { label: "En préparation", classes: "bg-blue-50 text-blue-700", Icon: PackageIcon },
  delivered: { label: "Livrée", classes: "bg-green-50 text-green-700", Icon: CheckIcon },
  cancelled: { label: "Annulée", classes: "bg-red-50 text-red-700", Icon: AlertCircleIcon },
};

export function OrderStatusBadge({ status }) {
  const cfg = ORDER_STATUS[status] ?? {
    label: status,
    classes: "bg-gray-100 text-gray-600",
    Icon: ClockIcon,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.classes}`}
    >
      <cfg.Icon size={12} />
      {cfg.label}
    </span>
  );
}

export const RETURN_STATUS = {
  requested: { label: "Retour demandé", classes: "bg-amber-50 text-amber-700" },
  approved: { label: "Retour approuvé", classes: "bg-blue-50 text-blue-700" },
  rejected: { label: "Retour refusé", classes: "bg-red-50 text-red-700" },
  refunded: { label: "Remboursé", classes: "bg-green-50 text-green-700" },
};

export function ReturnStatusBadge({ status }) {
  const cfg = RETURN_STATUS[status] ?? { label: status, classes: "bg-gray-100 text-gray-600" };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
}

// Garde d'authentification pour les sous-pages de l'espace client : renvoie
// vers /compte (formulaire de connexion) en conservant la page demandée.
export function RequireAccount({ children }) {
  const { loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) return <p className="px-4 py-10 text-center text-muted">Chargement…</p>;
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/compte"
        replace
        state={{
          from: location.pathname,
          authMode: "login",
          authMessage: "Connectez-vous pour accéder à votre espace client.",
        }}
      />
    );
  }
  return children;
}

export function AccountBreadcrumb({ to = "/compte", label = "Mon compte" }) {
  return (
    <Link
      to={to}
      className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-brand-dark"
    >
      <ChevronLeftIcon size={14} />
      {label}
    </Link>
  );
}
