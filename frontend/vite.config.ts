import { defineConfig, loadEnv } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, resolve(__dirname, ".."));
  const tailscaleHost = env.VITE_TAILSCALE_HOST;

  return {
  plugins: [svelte()],
  envDir: resolve(__dirname, ".."),
  server: {
    port: 5173,
    strictPort: false,
    allowedHosts: tailscaleHost ? [tailscaleHost] : [],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  };
});
