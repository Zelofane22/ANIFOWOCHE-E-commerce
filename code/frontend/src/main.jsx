import * as Sentry from "@sentry/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router";
import { InstallPromptProvider } from "./context/InstallPromptContext.jsx";
import App from "./App.jsx";
import ErrorFallback from "./components/ErrorFallback.jsx";
import { initPwaMeta } from "./utils/pwaMeta.js";
import "./index.css";

// Adapte les métadonnées PWA (manifest, icônes, titre) pour le sous-domaine
// vendeur AVANT le rendu React. Le middleware Vercel fait déjà ce travail
// côté serveur pour seller.anifowoche.com ; ce script est le fallback
// client-side et la double sécurité pour les navigateurs qui relisent le DOM.
initPwaMeta();

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

const EXPECTED_VALIDATION_ENDPOINTS = [
  "/auth/register/",
  "/seller/register/",
  "/promotions/coupons/validate/",
];

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
      const message = event?.exception?.values?.[0]?.value ?? "";
      if (
        message.includes("Failed to fetch dynamically imported module") ||
        message.includes("Error loading dynamically imported module") ||
        message.includes("Importing a module script failed")
      )
        return null;
      if (event?.exception?.values?.[0]?.mechanism?.type === "auto.http.client.xhr") {
        const status = event?.contexts?.response?.status_code ?? event?.contexts?.response?.status;
        const url = event?.request?.url ?? "";
        if (status === 404) return null;
        if (status === 401 && (url.includes("/auth/me/") || url.includes("/auth/token/"))) return null;
        if (
          status === 400 &&
          EXPECTED_VALIDATION_ENDPOINTS.some((endpoint) => url.includes(endpoint))
        )
          return null;
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
          <InstallPromptProvider>
            <App />
          </InstallPromptProvider>
        </BrowserRouter>
      </HelmetProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
