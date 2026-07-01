import apiClient from "./axios.js";

export const createOrder = (payload) =>
  apiClient.post("/orders/", payload).then((res) => res.data);

export const getOrders = () => apiClient.get("/orders/").then((res) => res.data);
