import apiClient from "../axios.js";

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
 * @returns {Promise<{subscription: Subscription|null, current_plan: string, limits: Limits}>}
 */
export const getSellerSubscription = () =>
  apiClient.get("/seller/subscription/").then((res) => res.data);

/**
 * @returns {Promise<Subscription>}
 */
export const createSellerSubscription = (plan) =>
  apiClient.post("/seller/subscription/", { plan }).then((res) => res.data);

/**
 * Devis d'un changement de plan (prorata d'upgrade ANIF Seller).
 * @returns {Promise<{plan: string, full_price_xof: number, credit_xof: number, amount_xof: number, remaining_days: number, ends_at: string|null, is_upgrade: boolean}>}
 */
export const getSellerSubscriptionQuote = (plan) =>
  apiClient.get("/seller/subscription/quote/", { params: { plan } }).then((res) => res.data);

/**
 * Relance le paiement du dernier abonnement vendeur (échoué / refusé / annulé).
 * @returns {Promise<Subscription>}
 */
export const relaunchSellerSubscription = () =>
  apiClient.post("/seller/subscription/relance-paiement/").then((res) => res.data);

/**
 * Résilie l'abonnement actif du vendeur (accès conservé jusqu'à l'échéance).
 * @returns {Promise<Subscription>}
 */
export const cancelSellerSubscription = () =>
  apiClient.post("/seller/subscription/cancel/").then((res) => res.data);

/**
 * Réactive un abonnement dont la résiliation a été demandée.
 * @returns {Promise<Subscription>}
 */
export const reactivateSellerSubscription = () =>
  apiClient.post("/seller/subscription/reactivate/").then((res) => res.data);
