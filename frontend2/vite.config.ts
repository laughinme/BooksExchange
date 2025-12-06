import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path"


export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  
  server: {
    https: {},
    proxy: {
      "/api/v1": {
        target: "https://hackathon-backend.fly.dev",
        changeOrigin: true,
        secure: true,
        followRedirects: true
      }
    }
  }
});
