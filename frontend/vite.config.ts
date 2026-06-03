import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "path";

export default defineConfig({
  plugins: [svelte()],
  envDir: resolve(__dirname, ".."),
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/scene': 'http://localhost:8000',
      '/ambience': 'http://localhost:8000',
      '/image': 'http://localhost:8000',
      '/music': 'http://localhost:8000',
      '/static': 'http://localhost:8000',
      '/control': { target: 'http://localhost:8000', ws: true },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
