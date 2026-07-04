import apiClient from "./axios.js";

export const fetchBanners = () => apiClient.get("/content/banners/").then((res) => res.data);
