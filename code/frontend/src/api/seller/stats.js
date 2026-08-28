import apiClient, { publicClient } from "../axios.js";

/**
 * @returns {Promise<{seller: SellerProfile, metrics: {products: number, orders_today: number, pending_orders: number, total_orders: number, total_revenue: number}, kpi: {revenue: number, revenue_change: number|null, orders: number, orders_change: number|null, avg_order_value: number, conversion_rate: number, period_days: number}, sales_chart: Array<{day: string, total: number}>, status_distribution: Record<string, number>, top_products: Array<{id: number, name: string, revenue: number, quantity: number}>, category_breakdown: Array<{name: string, total: number}>, low_stock: Array<{id: number, name: string, stock: number}>, recent_orders: Order[]}>}
 */
export const getSellerDashboard = (params = {}) =>
  apiClient.get("/seller/dashboard/", { params }).then((res) => res.data);

/**
 * @returns {Promise<{plans: Array<{code: string, name: string, price_xof: number|null, promo_price_xof: number|null, promo_duration_months: number|null, max_products: number|null, max_orders_per_month: number|null, features: string[]}>}>}
 */
export const getSellerPlans = () =>
  publicClient.get("/public/plans/").then((res) => res.data);
