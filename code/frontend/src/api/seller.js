import apiClient from "./axios.js";

export const registerSeller = (data) =>
  apiClient.post("/seller/register/", data).then((res) => res.data);

export const getSellerProfile = () => apiClient.get("/seller/profile/").then((res) => res.data);

export const updateSellerProfile = (data) =>
  apiClient.patch("/seller/profile/", data).then((res) => res.data);

export const getSellerDashboard = () => apiClient.get("/seller/dashboard/").then((res) => res.data);

export const getPublicShop = (slug) =>
  apiClient.get(`/public/shops/${slug}/`).then((res) => res.data);

export const getSellerProducts = () =>
  apiClient.get("/seller/products/").then((res) => res.data);

export const createSellerProduct = (data) =>
  apiClient.post("/seller/products/", data).then((res) => res.data);

export const updateSellerProduct = (slug, data) =>
  apiClient.patch(`/seller/products/${slug}/`, data).then((res) => res.data);

export const archiveSellerProduct = (slug) =>
  apiClient.delete(`/seller/products/${slug}/`).then((res) => res.data);
