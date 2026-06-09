import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react(), cloudflare()],
  build: {
    sourcemap: true,
  },
  server: {
    host: "127.0.0.1",
    port: 4173,
    proxy: {
      "/api": "http://127.0.0.1:8787",
    },
  },
});