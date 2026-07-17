import * as Sentry from "@sentry/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router";
import App from "./App.jsx";
import ErrorFallback from "./components/ErrorFallback.jsx";
import "./index.css";

const sentryDsn =
  import.meta.env.VITE_SENTRY_DSN ||
  "https://bc2ff1efc6a18599ddff3c00895c5757@o4511675639922688.ingest.us.sentry.io/4511675843149824";

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
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
