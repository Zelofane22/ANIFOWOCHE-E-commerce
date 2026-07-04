import apiClient from "./axios.js";

export const fetchWishlist = () => apiClient.get("/wishlist/").then((res) => res.data);

export const fetchWishlistStatus = (productId) =>
  apiClient.get(`/wishlist/${productId}/`).then((res) => res.data);

export const addToWishlist = (productId) =>
  apiClient.post("/wishlist/", { product_id: productId }).then((res) => res.data);

export const removeFromWishlist = (productId) => apiClient.delete(`/wishlist/${productId}/`);
