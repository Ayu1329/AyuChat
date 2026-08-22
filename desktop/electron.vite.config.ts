import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin, loadEnv } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, resolve(__dirname), "");
  const proxyTarget = env.VITE_API_PROXY_TARGET || "http://localhost:8080";

  return {
    main: {
      plugins: [externalizeDepsPlugin()],
    },
    preload: {
      plugins: [externalizeDepsPlugin()],
    },
    renderer: {
      resolve: {
        alias: {
          "@": resolve("src/renderer"),
          "@ayuchat/connect": resolve("../connect/src/index.ts"),
        },
        dedupe: ["@ayuchat/connect"],
      },
      server: {
        proxy: {
          "/api/v1": {
            target: proxyTarget,
            changeOrigin: true,
            ws: true,
          },
        },
      },
      // @tailwindcss/vite and electron-vite resolve different vite type graphs under pnpm
      plugins: [react(), ...(tailwindcss() as any)],
    },
  };
});
