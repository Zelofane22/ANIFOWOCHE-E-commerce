import apiClient from "./axios.js";

/**
 * @typedef {{ id: number, order: number, full_name: string, phone: string, email: string, address: string, city: string, latitude: string|null, longitude: string|null, delivery_zone: {id: number, name: string, fee_xof: number, latitude: string|null, longitude: string|null, radius_km: string, is_active: boolean}|null, status: string, coupon_code: string, discount_xof: number, total_xof: number, items: Array<{id: number, product_id: number, product_name: string, product_slug: string, product_image: string|null, quantity: number, unit_price_xof: number, subtotal_xof: number, color_name: string, color_hex: string, selected_options: Array<{group_id: number, group_name: string, option_id: number, option_name: string, price_xof: number}>}>, payment_info: {id: number, order: number, provider: string, method: string, status: string, amount_xof: number, fedapay_transaction_id: string, payment_url: string|null, created_at: string, updated_at: string}|null, cancelled_at: string|null, cancellation_reason: string, created_at: string, updated_at: string }} Order
 * @typedef {{ count: number, next: string|null, previous: string|null, results: any[] }} Paginated
 */

/**
 * @returns {Promise<Order>}
 */
export const createOrder = (payload) =>
  apiClient.post("/orders/", payload).then((res) => res.data);

/**
 * @returns {Promise<Paginated & {results: Order[]}>}
 */
export const getOrders = () => apiClient.get("/orders/").then((res) => res.data);

/**
 * @returns {Promise<Order>}
 */
export const getOrder = (id) => apiClient.get(`/orders/${id}/`).then((res) => res.data);

/**
 * Synchronise un panier abandonné côté backend dès qu'un email est connu.
 * @returns {Promise<{token: string|null, status: string|null, items: any[], shop: string|null}>}
 */
export const syncAbandonedCart = (payload) =>
  apiClient.post("/orders/abandoned-cart/", payload).then((res) => res.data);
