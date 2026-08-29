import { useContext } from "react";
import { StoreStatusContextValue } from "./storeStatusContextValue.js";

export function useStoreStatus() {
  const ctx = useContext(StoreStatusContextValue);
  if (!ctx) return { storeStatus: null, loading: false, maintenanceMode: false, refresh: async () => null };
  return ctx;
}
