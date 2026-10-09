import apiClient, { publicClient } from "../axios.js";

/**
 * @returns {Promise<{slug: string, available: boolean}>}
 */
export const checkShopSlugAvailability = (slug) =>
  apiClient.get("/seller/shop/slug-availability/", { params: { slug } }).then((res) => res.data);

/**
 * @returns {Promise<Array<{id: number, name: string, slug: string, city: string, description: string, public_path: string, product_count: number}>}
 */
export const getPublicShops = () =>
  publicClient.get("/public/shops/").then((res) => res.data);

/**
 * @returns {Promise<{id: number, name: string, slug: string, whatsapp_phone: string, city: string, description: string, delivery_zones: Array<{id: number, name: string, fee_xof: number, latitude: string|null, longitude: string|null, radius_km: string, is_active: boolean}>, public_path: string, image: string|null, products: Product[]}>}
 */
export const getPublicShop = (slug) =>
  publicClient.get(`/public/shops/${slug}/`).then((res) => res.data);

/**
 * Upload ou remplace l'avatar de la boutique du vendeur connecté.
 * @param {File} file
 * @returns {Promise<{id: number, name: string, slug: string, image: string|null}>}
 */
export const uploadShopAvatar = (file) => {
  const formData = new FormData();
  formData.append("image", file);
  return apiClient
    .patch("/seller/shop/avatar/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);
};

/**
 * Supprime l'avatar de la boutique du vendeur connecté.
 * @returns {Promise<{id: number, name: string, slug: string, image: string|null}>}
 */
export const deleteShopAvatar = () =>
  apiClient.delete("/seller/shop/avatar/").then((res) => res.data);
