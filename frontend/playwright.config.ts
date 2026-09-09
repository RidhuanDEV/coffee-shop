import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env["E2E_BASE_URL"] ?? "http://127.0.0.1:5173",
    headless: true,
    launchOptions: process.env["E2E_BROWSER_PATH"]
      ? { executablePath: process.env["E2E_BROWSER_PATH"] }
      : {},
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  reporter: [["list"], ["html", { open: "never" }]],
});
