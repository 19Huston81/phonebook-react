import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // 👈 ВАЖНО для локального использования
  server: {
    port: 3000,
  },
});
