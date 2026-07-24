import apiClient from "./axios.js";

export const registerSeller = (data) =>
  apiClient.post("/seller/register/", data).then((res) => res.data);

export const getSellerProfile = () => apiClient.get("/seller/profile/").then((res) => res.data);

export const updateSellerProfile = (data) =>
  apiClient.patch("/seller/profile/", data).then((res) => res.data);

export const getSellerDashboard = () => apiClient.get("/seller/dashboard/").then((res) => res.data);

export const getPublicShop = (slug) =>
  apiClient.get(`/public/shops/${slug}/`).then((res) => res.data);
