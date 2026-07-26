import * as Sentry from "@sentry/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router";
import App from "./App.jsx";
import ErrorFallback from "./components/ErrorFallback.jsx";
import "./index.css";

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

if (import.meta.env.PROD && sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.httpClientIntegration({ failedRequestStatusCodes: [[400, 599]] }),
      Sentry.reportingObserverIntegration(),
    ],
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
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
