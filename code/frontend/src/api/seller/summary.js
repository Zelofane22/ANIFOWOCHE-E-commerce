import apiClient from "../axios.js";

/**
 * Résumé léger pour la coque de l'espace vendeur (barre latérale, badges).
 * `pending_orders` = commandes au statut `received` (« À traiter »).
 * `unread_notifications` = non lues de la boîte de réception vendeur.
 * @returns {Promise<{seller: SellerProfile, pending_orders: number, unread_notifications: number}>}
 */
export const getSellerSummary = () => apiClient.get("/seller/summary/").then((res) => res.data);
