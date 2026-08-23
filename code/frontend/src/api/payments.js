import apiClient from "./axios.js";

/**
 * @returns {Promise<{id: number, order: number, provider: string, method: string, status: string, amount_xof: number, fedapay_transaction_id: string, payment_url: string|null, created_at: string, updated_at: string}>}
 */
export const initiatePayment = (payload) =>
  apiClient.post("/payments/initiate/", payload).then((res) => res.data);

/**
 * @returns {Promise<{id: number, order: number, provider: string, method: string, status: string, amount_xof: number, fedapay_transaction_id: string, payment_url: string|null, created_at: string, updated_at: string}>}
 */
export const getPayment = (id) => apiClient.get(`/payments/${id}/`).then((res) => res.data);

/**
 * @returns {Promise<{count: number, next: string|null, previous: string|null, results: Array<{id: number, order: number, provider: string, method: string, status: string, amount_xof: number, fedapay_transaction_id: string, payment_url: string|null, created_at: string, updated_at: string}>}>}
 */
export const getPayments = () => apiClient.get("/payments/").then((res) => res.data);

/**
 * @returns {Promise<{id: number, order: number, provider: string, method: string, status: string, amount_xof: number, fedapay_transaction_id: string, payment_url: string|null, created_at: string, updated_at: string}>}
 */
export const checkPaymentStatus = (id) =>
  apiClient.get(`/payments/status/${id}/`).then((res) => res.data);
