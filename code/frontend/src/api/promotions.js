import apiClient from "./axios.js";

export const validateCoupon = (code) =>
  apiClient.post("/promotions/coupons/validate/", { code }).then((res) => res.data);
