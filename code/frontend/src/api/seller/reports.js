import apiClient from "../axios.js";

/**
 * Télécharge l'export CSV des statistiques du vendeur (offres Pro/Business).
 * @param {{period?: number, date_from?: string, date_to?: string}} params
 * @returns {Promise<Blob>}
 */
export const exportSellerReport = (params = {}) =>
  apiClient
    .get("/seller/reports/export/", { params, responseType: "blob" })
    .then((res) => res.data);
