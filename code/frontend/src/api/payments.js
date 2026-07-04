import apiClient from "./axios.js";

export const initiatePayment = (payload) =>
  apiClient.post("/payments/initiate/", payload).then((res) => res.data);

export const getPayment = (id) => apiClient.get(`/payments/${id}/`).then((res) => res.data);
