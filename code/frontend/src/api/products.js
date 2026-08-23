import apiClient, { publicClient } from "./axios.js";

/**
 * @typedef {{ id: number, seller_id: number, seller_name: string|null, shop_id: number|null, name: string, slug: string, description: string, price_xof: number, unit: string, size: string, stock: number, made_to_order: boolean, in_stock: boolean, colors: Array<{name: string, hex: string, stock: number}>|null, image: string|null, images: Array<{id: number, image: string, alt_text: string, color_name: string, order: number, is_cover: boolean, is_active: boolean, created_at: string, updated_at: string}>, option_groups: Array<{id: number, name: string, is_required: boolean, min_selections: number, max_selections: number|null, order: number, options: Array<{id: number, name: string, price_xof: number, is_default: boolean, order: number}>}>, is_active: boolean, category: {id: number, name: string, slug: string}, category_id: number, category_path: string, rating_average: number|null, review_count: number, discount_percent: number|null, discounted_price_xof: number|null, created_at: string, updated_at: string }} Product
 * @typedef {{ id: number, name: string, slug: string, level: number, is_made_to_order: boolean, children: Category[] }} Category
 * @typedef {{ id: number, name: string, slug: string }} CategoryFlat
 * @typedef {{ count: number, next: string|null, previous: string|null, results: any[] }} Paginated
 */

/**
 * @returns {Promise<Paginated & {results: Product[]}>}
 */
export const fetchProducts = (params = {}) =>
  publicClient.get("/products/", { params }).then((res) => res.data);

/**
 * @returns {Promise<Product>}
 */
export const fetchProductBySlug = (slug) =>
  publicClient.get(`/products/${slug}/`).then((res) => res.data);

/**
 * @returns {Promise<Paginated & {results: CategoryFlat[]}>}
 */
export const fetchCategories = () =>
  publicClient.get("/products/categories/").then((res) => res.data);

/**
 * @returns {Promise<Category[]>}
 */
export const fetchCategoryTree = () =>
  publicClient.get("/products/categories/tree/").then((res) => res.data);

/**
 * @returns {Promise<Paginated & {results: Array<{id: number, name: string, is_required: boolean, min_selections: number, max_selections: number|null, order: number, options: Array<{id: number, name: string, price_xof: number, is_default: boolean, order: number}>}>}>}
 */
export const fetchProductOptionGroups = (slug) =>
  apiClient.get(`/seller/products/${slug}/option-groups/`).then((res) => res.data);

/**
 * @returns {Promise<{valid_items: Array<{id: number, slug: string, name: string, price_xof: number, unit: string, size: string, image: string|null, quantity: number, color_name: string, color_hex: string, selected_options: Array<{group_id: number, group_name: string, option_id: number, option_name: string, price_xof: number}>}>, invalid_slugs: string[]}>}
 */
export const validateCart = (items) =>
  publicClient.post("/products/validate-cart/", { items }).then((res) => res.data);
