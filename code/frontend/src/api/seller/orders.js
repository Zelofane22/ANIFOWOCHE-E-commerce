import apiClient from "../axios.js";
import { fetchAllPages } from "./paginate.js";

/**
 * Récupère TOUTES les commandes du vendeur (toutes les pages DRF).
 * Sans ça, liste, compteurs par statut, recherche et filtre « À traiter »
 * ne voyaient que les 20 premières commandes.
 * @returns {Promise<{count: number, results: Order[]}>}
 */
export const getSellerOrders = () => fetchAllPages("/seller/orders/");

/**
 * @returns {Promise<Order>}
 */
export const getSellerOrder = (orderId) =>
  apiClient.get(`/seller/orders/${orderId}/`).then((res) => res.data);

/**
 * @returns {Promise<Order>}
 */
export const updateSellerOrderStatus = (orderId, data) =>
  apiClient.patch(`/seller/orders/${orderId}/`, data).then((res) => res.data);

/**
 * @returns {Promise<Payment>}
 */
export const relaunchSellerPayment = (orderId) =>
  apiClient.post(`/seller/orders/${orderId}/relance-paiement/`).then((res) => res.data);

/**
 * @returns {Promise<Payment>}
 */
export const confirmSellerPayment = (orderId) =>
  apiClient.post(`/seller/orders/${orderId}/confirmer-paiement/`).then((res) => res.data);
