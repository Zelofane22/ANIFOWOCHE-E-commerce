import apiClient from "./axios.js";

export const fetchStoreStatus = () => apiClient.get("/store/status/").then((res) => res.data);
