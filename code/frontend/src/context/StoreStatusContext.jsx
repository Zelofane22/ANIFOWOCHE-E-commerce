import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchStoreStatus } from "../api/store.js";
import { StoreStatusContextValue } from "./storeStatusContextValue.js";

export function StoreStatusProvider({ children }) {
  const [storeStatus, setStoreStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchStoreStatus();
      setStoreStatus(data);
      return data;
    } catch {
      setStoreStatus(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchStoreStatus()
      .then((data) => {
        if (!cancelled) setStoreStatus(data);
      })
      .catch(() => {
        if (!cancelled) setStoreStatus(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Polling toutes les 60s + refresh au focus pour capter un changement de maintenance sans recharger
    const interval = setInterval(() => {
      fetchStoreStatus().then(setStoreStatus).catch(() => {});
    }, 60000);
    const onFocus = () => {
      fetchStoreStatus().then(setStoreStatus).catch(() => {});
    };
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const value = useMemo(
    () => ({
      storeStatus,
      loading,
      maintenanceMode: storeStatus?.maintenance_mode === true,
      refresh,
    }),
    [storeStatus, loading, refresh]
  );

  return <StoreStatusContextValue.Provider value={value}>{children}</StoreStatusContextValue.Provider>;
}
