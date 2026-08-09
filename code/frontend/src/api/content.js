import { publicClient } from "./axios.js";

// Bannières publiques — pas d'auth requise. publicClient évite un 401 SimpleJWT
// sur un token expiré (cf. issue JAVASCRIPT-REACT-4).
export const fetchBanners = () => publicClient.get("/content/banners/").then((res) => res.data);
