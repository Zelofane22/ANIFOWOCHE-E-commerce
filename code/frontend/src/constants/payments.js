// L'opérateur (MTN, Moov) est choisi par le client directement sur la page de
// paiement hébergée par FedaPay — on ne lui demande ici que le type de moyen.
export const PAYMENT_METHODS = [
  {
    value: "mtn",
    label: "Mobile Money",
    detail: "MTN, Moov — choix de l'opérateur sur la page de paiement",
    badge: "MOMO",
    type: "online",
  },
  { value: "card", label: "Carte bancaire", detail: "Visa, Mastercard", badge: "VISA", type: "online" },
  {
    value: "cash_on_delivery",
    label: "Paiement à la livraison",
    detail: "Réglez votre commande au moment de la réception.",
    badge: "CASH",
    type: "offline",
  },
];

export const ONLINE_PAYMENT_METHODS = PAYMENT_METHODS.filter((method) => method.type === "online");
