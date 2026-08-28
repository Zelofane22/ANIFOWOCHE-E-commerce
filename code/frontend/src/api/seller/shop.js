import apiClient, { publicClient } from "../axios.js";

/**
 * @returns {Promise<{slug: string, available: boolean}>}
 */
export const checkShopSlugAvailability = (slug) =>
  apiClient.get("/seller/shop/slug-availability/", { params: { slug } }).then((res) => res.data);

/**
 * @returns {Promise<{id: number, name: string, slug: string, whatsapp_phone: string, city: string, description: string, delivery_zones: Array<{id: number, name: string, fee_xof: number, latitude: string|null, longitude: string|null, radius_km: string, is_active: boolean}>, public_path: string, products: Product[]}>}
 */
export const getPublicShop = (slug) =>
  publicClient.get(`/public/shops/${slug}/`).then((res) => res.data);

/**
 * @returns {Promise<Product>}
 */
export const getPublicShopProduct = (shopSlug, productSlug) =>
  publicClient.get(`/public/shops/${shopSlug}/products/${productSlug}/`).then((res) => res.data);
