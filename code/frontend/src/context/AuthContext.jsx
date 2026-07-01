import { useEffect, useState } from "react";
import { fetchMe, loginUser, registerUser } from "../api/auth.js";
import { clearTokens, getAccessToken, setTokens } from "../utils/tokenStorage.js";
import { AuthContextValue } from "./authContextValue.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getAccessToken()));

  useEffect(() => {
    if (!getAccessToken()) return;
    fetchMe()
      .then(setUser)
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    setTokens(data);
    const me = await fetchMe();
    setUser(me);
    return me;
  };

  const register = async (payload) => {
    const data = await registerUser(payload);
    setTokens(data);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  const value = { user, loading, isAuthenticated: Boolean(user), login, register, logout };

  return <AuthContextValue.Provider value={value}>{children}</AuthContextValue.Provider>;
}
