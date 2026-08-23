import apiClient from "./axios.js";

/**
 * @returns {Promise<{user: {id: number, username: string, email: string, first_name: string, last_name: string, is_staff: boolean, notification_channel: string, phone: string}, access: string, refresh: string}>}
 */
export const registerUser = (data) =>
  apiClient.post("/auth/register/", data).then((res) => res.data);

/**
 * @returns {Promise<{access: string, refresh: string}>}
 */
export const loginUser = (credentials) =>
  apiClient.post("/auth/token/", credentials).then((res) => res.data);

/**
 * @returns {Promise<{detail: string}>}
 */
export const requestPasswordReset = (email) =>
  apiClient.post("/auth/password-reset/", { email }).then((res) => res.data);

/**
 * @returns {Promise<{detail: string}>}
 */
export const confirmPasswordReset = (data) =>
  apiClient.post("/auth/password-reset/confirm/", data).then((res) => res.data);

/**
 * @returns {Promise<{access: string}>}
 */
export const refreshAccessToken = (refresh) =>
  apiClient.post("/auth/token/refresh/", { refresh }).then((res) => res.data);

/**
 * @returns {Promise<{id: number, username: string, email: string, first_name: string, last_name: string, is_staff: boolean, notification_channel: string, phone: string}>}
 */
export const fetchMe = () => apiClient.get("/auth/me/").then((res) => res.data);
