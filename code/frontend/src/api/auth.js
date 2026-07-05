import apiClient from "./axios.js";

export const registerUser = (data) =>
  apiClient.post("/auth/register/", data).then((res) => res.data);

export const loginUser = (credentials) =>
  apiClient.post("/auth/token/", credentials).then((res) => res.data);

export const requestPasswordReset = (email) =>
  apiClient.post("/auth/password-reset/", { email }).then((res) => res.data);

export const confirmPasswordReset = (data) =>
  apiClient.post("/auth/password-reset/confirm/", data).then((res) => res.data);

export const refreshAccessToken = (refresh) =>
  apiClient.post("/auth/token/refresh/", { refresh }).then((res) => res.data);

export const fetchMe = () => apiClient.get("/auth/me/").then((res) => res.data);
