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
    if (response?.status === 401 && !config._retried && getRefreshToken()) {
      config._retried = true;
      try {
        const { data } = await refreshClient.post("/auth/token/refresh/", {
          refresh: getRefreshToken(),
        });
        setTokens({ access: data.access });
        config.headers.Authorization = `Bearer ${data.access}`;
        return apiClient(config);
      } catch {
        clearTokens();
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
