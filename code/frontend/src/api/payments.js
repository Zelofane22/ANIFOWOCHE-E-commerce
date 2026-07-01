import apiClient from "./axios.js";

export const initiatePayment = (payload) =>
  apiClient.post("/payments/initiate/", payload).then((res) => res.data);
