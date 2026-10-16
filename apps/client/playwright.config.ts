import { defineConfig } from "@playwright/test";

// The app must already be running (dev or build) at E2E_BASE_URL.
const baseURL = process.env.E2E_BASE_URL || "http://localhost:5173";

// On CI/dev machines Playwright uses its own managed browser (run
// `pnpm exec playwright install chromium`). In sandboxes with a pre-installed
// Chromium, point PW_CHROMIUM at it.
const executablePath = process.env.PW_CHROMIUM;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 0,
  reporter: "line",
  use: {
    baseURL,
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
});
