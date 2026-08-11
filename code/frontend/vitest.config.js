import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    env: {
      // Env de test déterministe, indépendant du .env local (localhost:5173 en dev).
      VITE_SITE_URL: "https://anifowoche.com",
    },
  },
});
