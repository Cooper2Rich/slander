import { defineConfig } from "@playwright/test";
const live = process.env.JOHN_PREVIEW_BASE_URL;
export default defineConfig({
  testDir: "./tests/john-browser",
  outputDir: "test-results/john-preview",
  workers: 1,
  reporter: "list",
  use: {
    baseURL: live || "http://127.0.0.1:3400/slander/demo-shared-with-john/",
    trace: "retain-on-failure",
    actionTimeout: 10000,
  },
  webServer: live
    ? undefined
    : {
        command: "node scripts/preview-public.mjs",
        url: "http://127.0.0.1:3400/slander/demo-shared-with-john/",
        reuseExistingServer: false,
        env: {
          PUBLIC_DEMO_DIRECTORY: "john-site",
          PUBLIC_DEMO_BASE_PATH: "/slander/demo-shared-with-john/",
          PUBLIC_DEMO_PORT: "3400",
        },
      },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1050 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 664 } } },
  ],
});
