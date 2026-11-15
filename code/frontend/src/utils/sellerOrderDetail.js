// Helpers d'affichage du détail d'une commande vendeur (vue desktop).

export const PAYMENT_STATUS = {
  pending: { label: "En attente", tone: "text-amber-700" },
  approved: { label: "Approuvé", tone: "text-emerald-700" },
  declined: { label: "Refusé", tone: "text-red-600" },
  canceled: { label: "Annulé", tone: "text-red-600" },
  failed: { label: "Échec", tone: "text-red-600" },
};

export const PAYMENT_METHOD_LABEL = {
  mtn: "MTN Mobile Money",
  moov: "Moov Money",
  card: "Carte bancaire",
  cash_on_delivery: "Paiement à la livraison",
};

export const FAILED_PAYMENT_STATUSES = ["failed", "declined", "canceled"];

export function whatsappUrl(phone, message) {
  const clean = (phone || "").replace(/[^0-9]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

// Messages WhatsApp prédéfinis proposés au vendeur.
export function customerMessages(order) {
  const hello = `Bonjour ${order.full_name || ""}`.trim();
  const ref = `votre commande ANIFOWOCHE #${order.id}`;
  return {
    contact: `${hello}, concernant ${ref}`,
    confirm: `${hello}, je confirme la réception de ${ref}. Je vous tiens au courant.`,
    paymentPending: `${hello}, le paiement de ${ref} n'a pas été confirmé. Pouvez-vous le finaliser ?`,
    paymentFailed: `${hello}, le paiement de ${ref} n'a pas abouti. Pourriez-vous le finaliser ?`,
    outOfStock: `${hello}, un article de ${ref} est en rupture de stock. Je vous contacte pour trouver une solution.`,
  };
}

export const itemsSubtotal = (order) =>
  (order.items ?? []).reduce(
    (sum, item) => sum + (Number(item.subtotal_xof) || (Number(item.unit_price_xof) || 0) * (Number(item.quantity) || 1)),
    0,
  );

export const isPickupOnly = (order) =>
  (order.items ?? []).length > 0 && (order.items ?? []).every((item) => item.delivery_method === "pickup");

export const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

// Étapes de l'historique : state = "done" | "current" | "todo" | "cancelled".
export function buildHistory(order) {
  const status = order.status;
  const payment = order.payment_info;
  const paid = payment?.status === "approved";
  const rank = { received: 0, prepared: 1, delivered: 2 }[status] ?? 0;

  const steps = [
    { key: "received", label: "Commande reçue", date: order.created_at, state: "done" },
    {
      key: "payment",
      label: payment?.method === "cash_on_delivery" ? "Paiement à la livraison" : "Paiement confirmé",
      date: paid ? payment.updated_at : null,
      note: payment && !paid ? PAYMENT_STATUS[payment.status]?.label : null,
      state: paid || status === "delivered" ? "done" : "todo",
    },
  ];

  if (status === "cancelled") {
    steps.push({
      key: "cancelled",
      label: "Commande annulée",
      date: order.cancelled_at || order.updated_at,
      note: order.cancellation_reason ? `Motif : ${order.cancellation_reason}` : null,
      state: "cancelled",
    });
    return steps;
  }

  steps.push(
    {
      key: "prepared",
      label: "Préparation",
      date: rank === 1 ? order.updated_at : null,
      state: rank > 1 ? "done" : rank === 1 ? "current" : "todo",
    },
    {
      key: "delivered",
      label: "Livrée",
      date: rank === 2 ? order.updated_at : null,
      state: rank === 2 ? "done" : "todo",
    },
  );
  return steps;
}
