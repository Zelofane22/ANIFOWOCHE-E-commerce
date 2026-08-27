import apiClient, { publicClient } from "./axios.js";

/**
 * @typedef {{ id: number, name: string, slug: string, whatsapp_phone: string, city: string, description: string, delivery_zones: Array<{id: number, name: string, fee_xof: number, latitude: string|null, longitude: string|null, radius_km: string, is_active: boolean}>, delivery_zone_ids?: number[], is_published: boolean, public_path: string, public_url: string, created_at: string, updated_at: string }} Shop
 * @typedef {{ id: number, display_name: string, phone: string, city: string, plan: string, shop: Shop, limits: Limits, created_at: string, updated_at: string }} SellerProfile
 * @typedef {{ plan: string, max_products: number|null, max_orders_per_month: number|null, price_xof: number|null, products_used: number, orders_this_month: number, orders_quota_reached: boolean, public_shop_visible: boolean, can_appear_on_main_store: boolean, features: Record<string, boolean> }} Limits
 * @typedef {{ id: number, seller_id: number, seller_name: string|null, shop_id: number|null, name: string, slug: string, description: string, price_xof: number, unit: string, size: string, stock: number, made_to_order: boolean, in_stock: boolean, colors: Array<{name: string, hex: string, stock: number}>|null, image: string|null, images: Array<{id: number, image: string, alt_text: string, color_name: string, order: number, is_cover: boolean, is_active: boolean, created_at: string, updated_at: string}>, option_groups: Array<{id: number, name: string, is_required: boolean, min_selections: number, max_selections: number|null, order: number, options: Array<{id: number, name: string, price_xof: number, is_default: boolean, order: number}>}>, is_active: boolean, category: {id: number, name: string, slug: string}, category_id: number, category_path: string, rating_average: number|null, review_count: number, discount_percent: number|null, discounted_price_xof: number|null, created_at: string, updated_at: string }} Product
 * @typedef {{ id: number, image: string, alt_text: string, color_name: string, order: number, is_cover: boolean, is_active: boolean, created_at: string, updated_at: string }} ProductImage
 * @typedef {{ id: number, order: number, full_name: string, phone: string, email: string, address: string, city: string, latitude: string|null, longitude: string|null, delivery_zone: {id: number, name: string, fee_xof: number, latitude: string|null, longitude: string|null, radius_km: string, is_active: boolean}|null, status: string, coupon_code: string, discount_xof: number, total_xof: number, items: Array<{id: number, product_id: number, product_name: string, product_slug: string, product_image: string|null, quantity: number, unit_price_xof: number, subtotal_xof: number, color_name: string, color_hex: string, selected_options: Array<{group_id: number, group_name: string, option_id: number, option_name: string, price_xof: number}>}>, payment_info: {id: number, order: number, provider: string, method: string, status: string, amount_xof: number, fedapay_transaction_id: string, payment_url: string, created_at: string, updated_at: string}|null, cancelled_at: string|null, cancellation_reason: string, created_at: string, updated_at: string }} Order
 * @typedef {{ id: number, seller: number, plan: string, plan_name: string, amount_xof: number, provider: string, status: string, status_name: string, fedapay_transaction_id: string, payment_url: string|null, starts_at: string|null, ends_at: string|null, created_at: string, updated_at: string }} Subscription
 * @typedef {{ id: number, order: number, provider: string, method: string, status: string, amount_xof: number, fedapay_transaction_id: string, payment_url: string|null, created_at: string, updated_at: string }} Payment
 * @typedef {{ count: number, next: string|null, previous: string|null, results: any[] }} Paginated
 */

/**
 * @returns {Promise<{user: {id: number, username: string, email: string, first_name: string, last_name: string, is_staff: boolean, notification_channel: string, phone: string}, seller: SellerProfile, access: string, refresh: string}>}
 */
export const registerSeller = (data) =>
  apiClient.post("/seller/register/", data).then((res) => res.data);

/**
 * @returns {Promise<SellerProfile>}
 */
export const getSellerProfile = () => apiClient.get("/seller/profile/").then((res) => res.data);

/**
 * @returns {Promise<SellerProfile>}
 */
export const updateSellerProfile = (data) =>
  apiClient.patch("/seller/profile/", data).then((res) => res.data);

/**
 * @returns {Promise<{slug: string, available: boolean}>}
 */
export const checkShopSlugAvailability = (slug) =>
  apiClient.get("/seller/shop/slug-availability/", { params: { slug } }).then((res) => res.data);

/**
 * @returns {Promise<{seller: SellerProfile, metrics: {products: number, orders_today: number, pending_orders: number, total_orders: number, total_revenue: number}, kpi: {revenue: number, revenue_change: number|null, orders: number, orders_change: number|null, avg_order_value: number, conversion_rate: number, period_days: number}, sales_chart: Array<{day: string, total: number}>, status_distribution: Record<string, number>, top_products: Array<{id: number, name: string, revenue: number, quantity: number}>, category_breakdown: Array<{name: string, total: number}>, low_stock: Array<{id: number, name: string, stock: number}>, recent_orders: Order[]}>}
 */
export const getSellerDashboard = (params = {}) =>
  apiClient.get("/seller/dashboard/", { params }).then((res) => res.data);

/**
 * @returns {Promise<Paginated & {results: Order[]}>}
 */
export const getSellerOrders = () => apiClient.get("/seller/orders/").then((res) => res.data);

/**
 * @returns {Promise<Order>}
 */
export const getSellerOrder = (orderId) =>
  apiClient.get(`/seller/orders/${orderId}/`).then((res) => res.data);

/**
 * @returns {Promise<Order>}
 */
export const updateSellerOrderStatus = (orderId, data) =>
  apiClient.patch(`/seller/orders/${orderId}/`, data).then((res) => res.data);

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
 * @returns {Promise<Payment>}
 */
export const relaunchSellerPayment = (orderId) =>
  apiClient.post(`/seller/orders/${orderId}/relance-paiement/`).then((res) => res.data);

/**
 * @returns {Promise<Payment>}
 */
export const confirmSellerPayment = (orderId) =>
  apiClient.post(`/seller/orders/${orderId}/confirmer-paiement/`).then((res) => res.data);

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

/**
 * @returns {Promise<{plans: Array<{code: string, name: string, price_xof: number|null, promo_price_xof: number|null, promo_duration_months: number|null, max_products: number|null, max_orders_per_month: number|null, features: string[]}>}>}
 */
export const getSellerPlans = () =>
  publicClient.get("/public/plans/").then((res) => res.data);

/**
 * @returns {Promise<{subscription: Subscription|null, current_plan: string, limits: Limits}>}
 */
export const getSellerSubscription = () =>
  apiClient.get("/seller/subscription/").then((res) => res.data);

/**
 * @returns {Promise<Subscription>}
 */
export const createSellerSubscription = (plan) =>
  apiClient.post("/seller/subscription/", { plan }).then((res) => res.data);
