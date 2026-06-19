import { defineConfig, loadEnv } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "..", "");
  Object.assign(process.env, env);

  return {
    plugins: [sveltekit()],
    server: {
      proxy: {
        "/api/control/ws": {
          target: "http://localhost:8000",
          ws: true,
        },
      },
    },
  };
});
