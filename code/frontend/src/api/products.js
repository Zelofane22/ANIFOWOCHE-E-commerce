import apiClient from "./axios.js";

export const fetchProducts = (params = {}) =>
  apiClient.get("/products/", { params }).then((res) => res.data);

export const fetchProductBySlug = (slug) =>
  apiClient.get(`/products/${slug}/`).then((res) => res.data);

export const fetchCategories = () =>
  apiClient.get("/products/categories/").then((res) => res.data);

export const fetchProductOptionGroups = (slug) =>
  apiClient.get(`/seller/products/${slug}/option-groups/`).then((res) => res.data);
