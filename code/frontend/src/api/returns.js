import apiClient from "./axios.js";

export const fetchReturnRequests = () => apiClient.get("/returns/").then((res) => res.data);

export const createReturnRequest = (payload) =>
  apiClient.post("/returns/", payload).then((res) => res.data);
