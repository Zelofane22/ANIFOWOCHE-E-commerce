import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// L'upload des source maps vers Sentry n'est actif que si SENTRY_AUTH_TOKEN
// est défini (env de build Vercel, avec SENTRY_ORG et SENTRY_PROJECT) —
// inactif en dev et dans Docker.
const sentryEnabled = Boolean(process.env.SENTRY_AUTH_TOKEN);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    sentryEnabled &&
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
      }),
  ].filter(Boolean),
  build: {
    // "hidden" : génère les maps pour Sentry sans les référencer dans le
    // bundle servi aux visiteurs.
    sourcemap: sentryEnabled ? "hidden" : false,
  },
  server: {
    port: 5173,
  },
});
