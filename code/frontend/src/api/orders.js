import apiClient from "./axios.js";

export const createOrder = (payload) =>
  apiClient.post("/orders/", payload).then((res) => res.data);

export const fetchOrders = () => apiClient.get("/orders/").then((res) => res.data);

export const updateOrderStatus = (id, status) =>
  apiClient.patch(`/orders/${id}/`, { status }).then((res) => res.data);
