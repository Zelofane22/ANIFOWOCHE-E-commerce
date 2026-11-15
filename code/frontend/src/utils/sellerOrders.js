// Helpers d'affichage des commandes vendeur (tableau de bord + page Commandes desktop).

export const ORDER_STATUS = {
  received: { label: "Reçue", pill: "bg-blue-50 text-blue-700", dot: "bg-blue-600" },
  prepared: { label: "Préparée", pill: "bg-violet-50 text-violet-700", dot: "bg-violet-600" },
  delivered: { label: "Livrée", pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-600" },
  cancelled: { label: "Annulée", pill: "bg-red-50 text-red-700", dot: "bg-red-600" },
};

// Statuts annulables côté API (Order.CANCELLABLE_STATUSES).
export const CANCELLABLE_STATUSES = ["received", "prepared"];

// Étape suivante proposée depuis la ligne d'une commande.
const NEXT_ACTION = {
  received: { status: "prepared", label: "Préparer" },
  prepared: { status: "delivered", label: "Marquer livrée" },
};

export const nextStatusAction = (status) => NEXT_ACTION[status] ?? null;

export const canCancel = (status) => CANCELLABLE_STATUSES.includes(status);

export const initialsOf = (name) =>
  (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

export const formatOrderDate = (iso) =>
  iso
    ? new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "";

export const itemsCount = (order) =>
  (order.items ?? []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

export const orderCustomerName = (order) => order.full_name || order.customer_name || `Commande #${order.id}`;
