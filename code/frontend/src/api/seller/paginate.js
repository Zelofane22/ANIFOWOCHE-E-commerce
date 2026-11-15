import apiClient from "../axios.js";

// Garde-fou : 50 pages × 20 éléments couvrent largement tous les paliers vendeur.
export const MAX_PAGES = 50;

/**
 * Parcourt la pagination DRF (PAGE_SIZE = 20) et renvoie tous les éléments.
 * Accepte aussi une réponse non paginée (tableau).
 * @param {string} url
 * @returns {Promise<{count: number, results: any[]}>}
 */
export const fetchAllPages = async (url) => {
  const results = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { data } = await apiClient.get(url, { params: { page } });
    if (Array.isArray(data)) return { count: data.length, results: data };
    results.push(...(data.results ?? []));
    if (!data.next) break;
  }
  return { count: results.length, results };
};
