import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { getSellerSummary } from "../api/seller.js";
import { SellerContextValue } from "./sellerContextValue.js";
import { useAuth } from "./useAuth.js";

/**
 * Charge le résumé vendeur (profil, commandes à traiter, notifications non
 * lues) pour toute l'application vendeur. Rafraîchi à chaque changement de
 * page ; les pages qui modifient une commande ou une notification appellent
 * `refresh()` pour mettre les badges à jour sans attendre la navigation.
 */
export function SellerProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { pathname } = useLocation();
  // Le résumé est rattaché à l'utilisateur qui l'a chargé : après une
  // déconnexion / reconnexion, celui du compte précédent n'est jamais affiché.
  const [state, setState] = useState({ userId: null, summary: null });

  const refresh = useCallback(async () => {
    if (!userId) return null;
    try {
      const summary = await getSellerSummary();
      setState({ userId, summary });
      return summary;
    } catch {
      return null;
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    getSellerSummary()
      .then((summary) => {
        if (!cancelled) setState({ userId, summary });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId, pathname]);

  const value = useMemo(() => {
    const summary = userId && state.userId === userId ? state.summary : null;
    return {
      seller: summary?.seller ?? null,
      pendingCount: summary?.pending_orders ?? 0,
      unreadCount: summary?.unread_notifications ?? 0,
      refresh,
    };
  }, [userId, state, refresh]);

  return <SellerContextValue.Provider value={value}>{children}</SellerContextValue.Provider>;
}
