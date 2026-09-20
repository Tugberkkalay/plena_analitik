import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    resolve: {
      alias: { "@": path.resolve(process.cwd(), "src") },
    },
    server: {
      port: 3002,
      strictPort: true,
    },
    preview: {
      port: 3002,
      strictPort: true,
    },
    define: {
      "process.env.REACT_APP_BACKEND_URL": JSON.stringify(
        env.VITE_BACKEND_URL || env.REACT_APP_BACKEND_URL || "",
      ),
    },
  };
});
