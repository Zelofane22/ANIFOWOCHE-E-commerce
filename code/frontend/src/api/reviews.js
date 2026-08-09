import { publicClient } from "./axios.js";

// Avis produits : lecture publique et soumission publique (author_name, pas
// request.user). publicClient évite un 401 SimpleJWT sur un token expiré
// (cf. issue JAVASCRIPT-REACT-4).
export const fetchProductReviews = (productSlug) =>
  publicClient.get("/reviews/", { params: { product__slug: productSlug } }).then((res) => res.data);

export const createReview = (payload) => publicClient.post("/reviews/", payload).then((res) => res.data);
