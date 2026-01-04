import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Test Configuration
 *
 * By default, runs against a production build for maximum fidelity.
 * Set USE_DEV_SERVER=1 to run against `npm run dev` instead.
 *
 * Environment Variables:
 * - PLAYWRIGHT_PORT: Override the server port (default: 3000)
 * - PLAYWRIGHT_BASE_URL: Override the base URL (default: http://127.0.0.1:3000)
 * - USE_DEV_SERVER=1: Run against dev server instead of production build
 * - CI: Enables retries, GitHub reporter, and forces fresh server
 * - E2E_REQUIRE_TESTIDS=1: Fail instead of skip when test IDs are missing
 */

const PORT = process.env.PLAYWRIGHT_PORT ?? "3000";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 2 : 0,

  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html"]],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },

  webServer: {
    command:
      process.env.USE_DEV_SERVER === "1"
        ? `pnpm run dev -- -p ${PORT}`
        : `pnpm run build && pnpm run start -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },

  projects: [
    // Desktop browsers
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    // Mobile browsers
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 12"] },
    },
  ],
});
