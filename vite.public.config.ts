import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/slander/",
  build: {
    outDir: "public-site",
    rollupOptions: { input: "public-demo.html" },
  },
});
