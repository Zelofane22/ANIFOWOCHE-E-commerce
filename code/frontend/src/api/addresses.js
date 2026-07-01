import apiClient from "./axios.js";

export const getAddresses = () => apiClient.get("/auth/addresses/").then((res) => res.data);

export const createAddress = (payload) =>
  apiClient.post("/auth/addresses/", payload).then((res) => res.data);

export const deleteAddress = (id) =>
  apiClient.delete(`/auth/addresses/${id}/`).then((res) => res.data);
