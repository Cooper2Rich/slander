import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  base: "/slander/",
  resolve: {
    alias: {
      "./media-samples.js": fileURLToPath(
        new URL("./src/public-demo/media.ts", import.meta.url),
      ),
      "node:crypto": fileURLToPath(
        new URL("./src/public-demo/platform-crypto.ts", import.meta.url),
      ),
      "node:fs": fileURLToPath(
        new URL("./src/public-demo/media.ts", import.meta.url),
      ),
    },
  },
  build: {
    outDir: "public-site",
    rollupOptions: { input: "public-demo.html" },
  },
});
