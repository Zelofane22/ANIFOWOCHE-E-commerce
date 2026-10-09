import apiClient, { publicClient } from "./axios.js";

// Config publique du site (thème, textes, sections) — pas d'auth requise.
// On utilise publicClient (sans Authorization) pour éviter un 401 SimpleJWT
// lorsqu'un token d'accès expiré est encore en localStorage (issue JAVASCRIPT-REACT-4).
export const fetchSiteConfig = () => publicClient.get("/site-config/").then((res) => res.data);

// --- Gestion/versioning de l'apparence (super-admin uniquement, US-54) -------
// Ces endpoints sont protégés côté backend (IsSuperAdmin) et requièrent le
// jeton d'accès : on passe donc par apiClient (authentifié + refresh).

export const fetchDraft = () => apiClient.get("/site-config/draft/").then((res) => res.data);

export const saveDraft = (payload) =>
  apiClient.put("/site-config/draft/", payload).then((res) => res.data);

export const previewVersion = (id) =>
  apiClient.get(`/site-config/preview/${id}/`).then((res) => res.data);

export const publishDraft = () =>
  apiClient.post("/site-config/publish/", {}).then((res) => res.data);

export const fetchHistory = () => apiClient.get("/site-config/history/").then((res) => res.data);

export const restoreVersion = (id) =>
  apiClient.post(`/site-config/restore/${id}/`, {}).then((res) => res.data);
