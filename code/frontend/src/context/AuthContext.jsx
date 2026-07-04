import * as Sentry from "@sentry/react";
import { useEffect, useState } from "react";
import { fetchMe, loginUser, registerUser } from "../api/auth.js";
import { clearTokens, getAccessToken, setTokens } from "../utils/tokenStorage.js";
import { AuthContextValue } from "./authContextValue.js";

// Associe l'utilisateur connecté aux événements Sentry (no-op si Sentry
// n'est pas initialisé). Seul l'id est envoyé, pas d'email ni de téléphone.
const setSentryUser = (user) => Sentry.setUser(user ? { id: user.id } : null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getAccessToken()));

  const applyUser = (me) => {
    setUser(me);
    setSentryUser(me);
  };

  useEffect(() => {
    if (!getAccessToken()) return;
    fetchMe()
      .then(applyUser)
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
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

  const logout = () => {
    clearTokens();
    applyUser(null);
  };

  const value = { user, loading, isAuthenticated: Boolean(user), login, register, logout };

  return <AuthContextValue.Provider value={value}>{children}</AuthContextValue.Provider>;
}
