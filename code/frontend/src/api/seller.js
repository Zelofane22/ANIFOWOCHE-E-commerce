import apiClient from "./axios.js";

export const registerSeller = (data) =>
  apiClient.post("/seller/register/", data).then((res) => res.data);

export const getSellerProfile = () => apiClient.get("/seller/profile/").then((res) => res.data);

export const updateSellerProfile = (data) =>
  apiClient.patch("/seller/profile/", data).then((res) => res.data);

export const getSellerDashboard = () => apiClient.get("/seller/dashboard/").then((res) => res.data);

export const getSellerOrders = () => apiClient.get("/seller/orders/").then((res) => res.data);

export const getSellerOrder = (orderId) =>
  apiClient.get(`/seller/orders/${orderId}/`).then((res) => res.data);

export const updateSellerOrderStatus = (orderId, data) =>
  apiClient.patch(`/seller/orders/${orderId}/`, data).then((res) => res.data);

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

export const getSellerProductImages = (slug) =>
  apiClient.get(`/seller/products/${slug}/images/`).then((res) => res.data);

export const createSellerProductImage = (slug, data) =>
  apiClient.post(`/seller/products/${slug}/images/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((res) => res.data);

export const updateSellerProductImage = (slug, imageId, data) =>
  apiClient.patch(`/seller/products/${slug}/images/${imageId}/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((res) => res.data);

export const deleteSellerProductImage = (slug, imageId) =>
  apiClient.delete(`/seller/products/${slug}/images/${imageId}/`).then((res) => res.data);

export const relaunchSellerPayment = (orderId) =>
  apiClient.post(`/seller/orders/${orderId}/relance-paiement/`).then((res) => res.data);

export const confirmSellerPayment = (orderId) =>
  apiClient.post(`/seller/orders/${orderId}/confirmer-paiement/`).then((res) => res.data);
