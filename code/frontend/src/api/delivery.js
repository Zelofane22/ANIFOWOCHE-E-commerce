import apiClient from "./axios.js";

export const fetchDeliveryZones = () =>
  apiClient.get("/delivery/zones/").then((res) => res.data);

export const fetchDeliverySlots = () =>
  apiClient.get("/delivery/slots/").then((res) => res.data);

export const createDelivery = (payload) =>
  apiClient.post("/delivery/", payload).then((res) => res.data);

export const fetchDeliveries = () => apiClient.get("/delivery/").then((res) => res.data);

export const updateDelivery = (id, payload) =>
  apiClient.patch(`/delivery/${id}/`, payload).then((res) => res.data);
