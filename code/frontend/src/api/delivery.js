import apiClient, { publicClient } from "./axios.js";

/**
 * @returns {Promise<{count: number, next: string|null, previous: string|null, results: Array<{id: number, name: string, fee_xof: number, latitude: string|null, longitude: string|null, radius_km: string, is_active: boolean}>}>}
 */
export const fetchDeliveryZones = () =>
  publicClient.get("/delivery/zones/").then((res) => res.data);

/**
 * @returns {Promise<{count: number, next: string|null, previous: string|null, results: Array<{id: number, label: string, start_time: string, end_time: string, is_active: boolean}>}>}
 */
export const fetchDeliverySlots = () =>
  publicClient.get("/delivery/slots/").then((res) => res.data);

/**
 * @returns {Promise<{id: number, order_id: number, zone: {id: number, name: string, fee_xof: number, latitude: string|null, longitude: string|null, radius_km: string, is_active: boolean}, zone_id: number, slot: {id: number, label: string, start_time: string, end_time: string, is_active: boolean}, slot_id: number, courier_name: string, status: string, scheduled_date: string|null, created_at: string, updated_at: string}>}
 */
export const createDelivery = (payload) =>
  apiClient.post("/delivery/", payload).then((res) => res.data);

/**
 * @returns {Promise<{zone: {id: number, name: string, fee_xof: number, latitude: string|null, longitude: string|null, radius_km: string, is_active: boolean}|null, distance_km: number|null}>}
 */
export const geolocateZone = (payload) =>
  publicClient.post("/delivery/geolocate/", payload).then((res) => res.data);
