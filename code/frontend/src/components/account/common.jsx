import { Link, Navigate, useLocation } from "react-router";
import { ChevronLeftIcon, ClockIcon } from "../icons.jsx";
import { useAuth } from "../../context/useAuth.js";
import { ORDER_STATUS, RETURN_STATUS } from "./orderHelpers.js";

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
