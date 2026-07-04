import apiClient from "./axios.js";

export const fetchNotificationSettings = () =>
  apiClient.get("/notifications/settings/").then((res) => res.data);
