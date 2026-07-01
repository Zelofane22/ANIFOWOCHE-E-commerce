import apiClient from "./axios.js";

export const initiatePayment = (payload) =>
  apiClient.post("/payments/initiate/", payload).then((res) => res.data);

export const fetchPayments = () => apiClient.get("/payments/").then((res) => res.data);
