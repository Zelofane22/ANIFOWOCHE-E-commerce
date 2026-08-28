import apiClient from "../axios.js";

/**
 * @returns {Promise<Paginated & {results: Order[]}>}
 */
export const getSellerOrders = () => apiClient.get("/seller/orders/").then((res) => res.data);

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
