import { useContext } from "react";
import { SellerContextValue } from "./sellerContextValue.js";

const EMPTY = { seller: null, pendingCount: 0, unreadCount: 0, refresh: async () => null };

/** Profil vendeur + compteurs partagés par toutes les pages de l'espace vendeur. */
export function useSeller() {
  return useContext(SellerContextValue) ?? EMPTY;
}
