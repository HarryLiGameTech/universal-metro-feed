import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/clockface": {
        target: "http://100.92.91.101:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/clockface/, ""),
      },
    },
  },
});
