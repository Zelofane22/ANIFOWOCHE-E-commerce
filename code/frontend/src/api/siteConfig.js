import { publicClient } from "./axios.js";

// Config publique du site (thème, textes, sections) — pas d'auth requise.
// On utilise publicClient (sans Authorization) pour éviter un 401 SimpleJWT
// lorsqu'un token d'accès expiré est encore en localStorage (issue JAVASCRIPT-REACT-4).
export const fetchSiteConfig = () => publicClient.get("/site-config/").then((res) => res.data);
