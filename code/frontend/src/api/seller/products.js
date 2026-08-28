import apiClient from "../axios.js";

/**
 * @returns {Promise<Paginated & {results: Product[]}>}
 */
export const getSellerProducts = () =>
  apiClient.get("/seller/products/").then((res) => res.data);

/**
 * @returns {Promise<Product>}
 */
export const createSellerProduct = (data) =>
  apiClient.post("/seller/products/", data).then((res) => res.data);

/**
 * @returns {Promise<Product>}
 */
export const updateSellerProduct = (slug, data) =>
  apiClient.patch(`/seller/products/${slug}/`, data).then((res) => res.data);

/**
 * @returns {Promise<void>}
 */
export const archiveSellerProduct = (slug) =>
  apiClient.delete(`/seller/products/${slug}/`).then((res) => res.data);

/**
 * Réactive un produit archivé (PATCH is_active=true).
 * @returns {Promise<Product>}
 */
export const reactivateSellerProduct = (slug) =>
  apiClient.patch(`/seller/products/${slug}/`, { is_active: true }).then((res) => res.data);

/**
 * @returns {Promise<Paginated & {results: ProductImage[]}>}
 */
export const getSellerProductImages = (slug) =>
  apiClient.get(`/seller/products/${slug}/images/`).then((res) => res.data);

/**
 * @returns {Promise<ProductImage>}
 */
export const createSellerProductImage = (slug, data) =>
  apiClient.post(`/seller/products/${slug}/images/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((res) => res.data);

/**
 * @returns {Promise<ProductImage>}
 */
export const updateSellerProductImage = (slug, imageId, data) =>
  apiClient.patch(`/seller/products/${slug}/images/${imageId}/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((res) => res.data);

/**
 * @returns {Promise<void>}
 */
export const deleteSellerProductImage = (slug, imageId) =>
  apiClient.delete(`/seller/products/${slug}/images/${imageId}/`).then((res) => res.data);

/**
 * @returns {Promise<Paginated & {results: Array<{id: number, name: string, is_required: boolean, min_selections: number, max_selections: number|null, order: number, options: Array<{id: number, name: string, price_xof: number, is_default: boolean, order: number}>}>}>}
 */
export const getProductOptionGroups = (slug) =>
  apiClient.get(`/seller/products/${slug}/option-groups/`).then((res) => res.data);

/**
 * @returns {Promise<{id: number, name: string, is_required: boolean, min_selections: number, max_selections: number|null, order: number, options: Array<{id: number, name: string, price_xof: number, is_default: boolean, order: number}>}>}
 */
export const createOptionGroup = (slug, data) =>
  apiClient.post(`/seller/products/${slug}/option-groups/`, data).then((res) => res.data);

/**
 * @returns {Promise<{id: number, name: string, is_required: boolean, min_selections: number, max_selections: number|null, order: number, options: Array<{id: number, name: string, price_xof: number, is_default: boolean, order: number}>}>}
 */
export const updateOptionGroup = (slug, id, data) =>
  apiClient.patch(`/seller/products/${slug}/option-groups/${id}/`, data).then((res) => res.data);

/**
 * @returns {Promise<void>}
 */
export const deleteOptionGroup = (slug, id) =>
  apiClient.delete(`/seller/products/${slug}/option-groups/${id}/`).then((res) => res.data);

/**
 * @returns {Promise<{id: number, name: string, price_xof: number, is_default: boolean, order: number}>}
 */
export const createOption = (slug, groupId, data) =>
  apiClient.post(`/seller/products/${slug}/option-groups/${groupId}/options/`, data).then((res) => res.data);

/**
 * @returns {Promise<{id: number, name: string, price_xof: number, is_default: boolean, order: number}>}
 */
export const updateOption = (slug, groupId, id, data) =>
  apiClient.patch(`/seller/products/${slug}/option-groups/${groupId}/options/${id}/`, data).then((res) => res.data);

/**
 * @returns {Promise<void>}
 */
export const deleteOption = (slug, groupId, id) =>
  apiClient.delete(`/seller/products/${slug}/option-groups/${groupId}/options/${id}/`).then((res) => res.data);
