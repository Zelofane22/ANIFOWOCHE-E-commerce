import * as Sentry from "@sentry/react";
import { useEffect, useState } from "react";
import { fetchMe, loginUser, registerUser } from "../api/auth.js";
import { AUTH_EXPIRED_EVENT } from "../api/axios.js";
import { registerSeller as registerSellerApi } from "../api/seller.js";
import { clearTokens, getAccessToken, setTokens } from "../utils/tokenStorage.js";
import { AuthContextValue } from "./authContextValue.js";
import { startTokenRefresher, stopTokenRefresher } from "../utils/tokenRefresher.js";

// Associe l'utilisateur connecté aux événements Sentry (no-op si Sentry
// n'est pas initialisé). Seul l'id est envoyé, pas d'email ni de téléphone.
const setSentryUser = (user) => Sentry.setUser(user ? { id: user.id } : null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getAccessToken()));

  const applyUser = (me) => {
    setUser(me);
    setSentryUser(me);
    if (me) {
      startTokenRefresher();
    } else {
      stopTokenRefresher();
    }
  };

  useEffect(() => {
    if (!getAccessToken()) return;
    fetchMe()
      .then(applyUser)
      .catch(() => {
        clearTokens();
        setUser(null);
        setSentryUser(null);
        stopTokenRefresher();
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Rafraîchissement impossible (refresh token invalide/expiré) : on remet
    // l'état d'authentification à zéro pour ne pas rester « connecté » côté UI
    // alors que tous les appels API renvoient désormais des 401.
    const onAuthExpired = () => {
      clearTokens();
      setUser(null);
      setSentryUser(null);
      stopTokenRefresher();
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
  }, []);

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    setTokens(data);
    const me = await fetchMe();
    applyUser(me);
    return me;
  };

  const register = async (payload) => {
    const data = await registerUser(payload);
    setTokens(data);
    applyUser(data.user);
    return data.user;
  };

  const registerSeller = async (payload) => {
    const data = await registerSellerApi(payload);
    setTokens(data);
    applyUser(data.user);
    return data;
  };

  const logout = () => {
    clearTokens();
    applyUser(null);
  };

  const value = { user, loading, isAuthenticated: Boolean(user), login, register, registerSeller, logout };

  return <AuthContextValue.Provider value={value}>{children}</AuthContextValue.Provider>;
}
