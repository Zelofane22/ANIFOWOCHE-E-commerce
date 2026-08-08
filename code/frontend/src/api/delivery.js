import apiClient, { publicClient } from "./axios.js";

export const fetchDeliveryZones = () =>
  publicClient.get("/delivery/zones/").then((res) => res.data);

export const fetchDeliverySlots = () =>
  publicClient.get("/delivery/slots/").then((res) => res.data);

export const createDelivery = (payload) =>
  apiClient.post("/delivery/", payload).then((res) => res.data);

export const geolocateZone = (payload) =>
  publicClient.post("/delivery/geolocate/", payload).then((res) => res.data);
