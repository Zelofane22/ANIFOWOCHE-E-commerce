import apiClient from "./axios.js";

export const fetchProductReviews = (productSlug) =>
  apiClient.get("/reviews/", { params: { product__slug: productSlug } }).then((res) => res.data);

export const createReview = (payload) => apiClient.post("/reviews/", payload).then((res) => res.data);
