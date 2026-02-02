import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path"
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  plugins: [tailwindcss(), react(), basicSsl()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  
  server: {
    https: {},
    proxy: {
      "/api/v1": {
        target: "https://books-exchange.fly.dev",
        changeOrigin: true,
        secure: true,
        followRedirects: true,
        cookieDomainRewrite: "localhost",
      }
    }
  }
});
