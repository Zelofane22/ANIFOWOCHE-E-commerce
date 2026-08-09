import axios from "axios";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "../utils/tokenStorage.js";

const rawBaseURL = import.meta.env.VITE_API_BASE_URL;
const baseURL = rawBaseURL ? rawBaseURL.replace(/\/+$/, "") : "http://localhost:8000/api";
const apiBaseURL = (() => {
  try {
    const parsed = new URL(baseURL);
    return parsed.pathname === "" || parsed.pathname === "/" ? `${baseURL}/api` : baseURL;
  } catch {
    return baseURL;
  }
})();

const apiClient = axios.create({ baseURL: apiBaseURL });
const refreshClient = axios.create({ baseURL: apiBaseURL });
const publicClient = axios.create({ baseURL: apiBaseURL });

export const AUTH_EXPIRED_EVENT = "anifowoche:auth-expired";
export const AUTH_LOGIN_EVENT = "anifowoche:auth-login";

let refreshPromise = null;

const notifyAuthExpired = () => window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));

export async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post("/auth/token/refresh/", { refresh })
      .then(({ data }) => {
        setTokens({ access: data.access });
        return data.access;
      })
      .catch((err) => {
        console.warn("[auth] refresh token expired or invalid:", err?.response?.status ?? err?.message);
        clearTokens();
        notifyAuthExpired();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    if (response?.status === 401 && !config._retried) {
      config._retried = true;
      const access = await refreshAccessToken();
      if (access) {
        config.headers.Authorization = `Bearer ${access}`;
        return apiClient(config);
      }
    }
    return Promise.reject(error);
  }
);

export { publicClient };
export default apiClient;
