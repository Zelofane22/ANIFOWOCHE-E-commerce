import { refreshAccessToken } from "../api/axios.js";
import { getAccessToken } from "./tokenStorage.js";
import { getAccessTokenExpiry } from "./jwt.js";

const REFRESH_MARGIN_MS = 60_000;

let refreshTimer = null;
let isRefreshing = false;

function clearRefreshTimer() {
  if (refreshTimer !== null) {
    window.clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

async function refreshNow() {
  if (isRefreshing) return;
  isRefreshing = true;
  try {
    await refreshAccessToken();
  } finally {
    isRefreshing = false;
    scheduleRefresh();
  }
}

function scheduleRefresh() {
  clearRefreshTimer();
  const token = getAccessToken();
  if (!token) return;
  const expiry = getAccessTokenExpiry(token);
  if (!expiry) return;
  const delay = expiry - Date.now() - REFRESH_MARGIN_MS;
  if (delay <= 0) {
    void refreshNow();
    return;
  }
  refreshTimer = window.setTimeout(refreshNow, delay);
}

function handleVisibilityChange() {
  if (document.visibilityState !== "visible") return;
  const token = getAccessToken();
  if (!token) return;
  const expiry = getAccessTokenExpiry(token);
  if (!expiry) return;
  if (expiry - Date.now() <= REFRESH_MARGIN_MS) {
    void refreshNow();
  }
}

export function startTokenRefresher() {
  scheduleRefresh();
  document.addEventListener("visibilitychange", handleVisibilityChange);
}

export function stopTokenRefresher() {
  clearRefreshTimer();
  document.removeEventListener("visibilitychange", handleVisibilityChange);
}
