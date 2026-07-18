import apiClient from "./axios.js";

// Config publique du site (thème, textes, sections) — pas d'auth requise.
export const fetchSiteConfig = () => apiClient.get("/site-config/").then((res) => res.data);
