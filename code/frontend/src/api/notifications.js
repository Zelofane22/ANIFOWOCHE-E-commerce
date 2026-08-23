import apiClient from "./axios.js";

export const fetchNotificationSettings = () =>
  apiClient.get("/notifications/settings/").then((res) => res.data);

export const fetchSellerNotifications = () =>
  apiClient.get("/notifications/seller/").then((res) => res.data);

export const markSellerNotificationRead = (id) =>
  apiClient.patch(`/notifications/seller/${id}/read/`, {}).then((res) => res.data);

export const markAllSellerNotificationsRead = () =>
  apiClient.post("/notifications/seller/mark-all-read/").then((res) => res.data);
