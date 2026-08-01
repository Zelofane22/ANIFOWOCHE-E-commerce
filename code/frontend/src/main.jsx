import * as Sentry from "@sentry/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router";
import App from "./App.jsx";
import ErrorFallback from "./components/ErrorFallback.jsx";
import "./index.css";

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

if (import.meta.env.PROD && sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.httpClientIntegration({ failedRequestStatusCodes: [[400, 403], [405, 599]] }),
      Sentry.reportingObserverIntegration(),
    ],
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event?.exception?.values?.[0]?.mechanism?.type === "auto.http.client.xhr") {
        const status = event?.contexts?.response?.status_code ?? event?.contexts?.response?.status;
        const url = event?.request?.url ?? "";
        if (status === 404) return null;
        if (status === 401 && (url.includes("/auth/me/") || url.includes("/auth/token/"))) return null;
        const method = (event?.request?.method ?? "").toUpperCase();
        if (status === 400 && (url.includes("/register/") || (url.includes("/seller/") && ["POST", "PATCH", "DELETE"].includes(method)))) return null;
      }
      return event;
    },
  });
}

if (import.meta.env.PROD) {
  const CHUNK_RELOAD_KEY = "anifowoche:chunk-reload";

  const CHUNK_ERROR_PATTERNS = [
    "Failed to fetch dynamically imported module",
    "Error loading dynamically imported module",
    "Importing a module script failed",
  ];

  function isChunkError(message) {
    return CHUNK_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
  }

  function reloadOnceOnChunkError() {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
    window.location.reload();
  }

  window.addEventListener("error", (event) => {
    if (isChunkError(event.message || event.reason?.message || "")) {
      reloadOnceOnChunkError();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (isChunkError(event.reason?.message || "")) {
      reloadOnceOnChunkError();
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <HelmetProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HelmetProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
