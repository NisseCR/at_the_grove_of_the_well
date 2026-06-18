import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    proxy: {
      "/api/control/ws": {
        target: "http://localhost:8000",
        ws: true,
      },
    },
  },
});
