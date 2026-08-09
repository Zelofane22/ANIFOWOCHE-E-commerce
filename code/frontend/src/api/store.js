import { publicClient } from "./axios.js";

// État public de la boutique — pas d'auth requise. publicClient évite un 401
// SimpleJWT sur un token expiré (cf. issue JAVASCRIPT-REACT-4).
export const fetchStoreStatus = () => publicClient.get("/store/status/").then((res) => res.data);
