import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [sveltekit()],
  envDir: resolve(__dirname, ".."),
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      "/api": { target: "http://localhost:8000", ws: true },
    },
  },
});
