import { defineConfig } from "@playwright/test";
const live = process.env.WORKING_PREVIEW_BASE_URL;
export default defineConfig({
  testDir: "./tests/working-browser",
  outputDir: "test-results/working-preview",
  workers: 1,
  reporter: "list",
  use: {
    baseURL: live || "http://127.0.0.1:3300/slander/working/",
    trace: "retain-on-failure",
  },
  webServer: live
    ? undefined
    : {
        command: "node scripts/preview-public.mjs",
        url: "http://127.0.0.1:3300/slander/working/",
        reuseExistingServer: false,
        env: {
          PUBLIC_DEMO_BASE_PATH: "/slander/working/",
          PUBLIC_DEMO_PORT: "3300",
        },
      },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1050 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 664 } } },
  ],
});
