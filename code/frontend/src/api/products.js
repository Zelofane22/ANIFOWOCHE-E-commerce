import apiClient, { publicClient } from "./axios.js";

export const fetchProducts = (params = {}) =>
  publicClient.get("/products/", { params }).then((res) => res.data);

export const fetchProductBySlug = (slug) =>
  publicClient.get(`/products/${slug}/`).then((res) => res.data);

export const fetchCategories = () =>
  publicClient.get("/products/categories/").then((res) => res.data);

export const fetchProductOptionGroups = (slug) =>
  apiClient.get(`/seller/products/${slug}/option-groups/`).then((res) => res.data);

export const validateCart = (items) =>
  publicClient.post("/products/validate-cart/", { items }).then((res) => res.data);
