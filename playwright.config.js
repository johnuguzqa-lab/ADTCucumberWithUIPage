// Playwright configuration.
//
// Cucumber.js drives the test execution in this project; Playwright is used
// as the browser-automation engine underneath it. This file centralises the
// shared Playwright options (browser project, viewport, baseURL, timeouts,
// screenshots) so the two layers do not drift apart.
//
// It is consumed by:
//   - features/support/hooks.js  -> launches the Chromium browser
//   - features/support/world.js  -> exposes the page for step definitions
//
// You can also run the standalone Playwright CLI against this config, e.g.
//   npx playwright test --config playwright.config.js  (not used by default)
//
// Timeouts here apply to Playwright's own actions (click, fill, waitFor)
// unless a step overrides them. We intentionally keep them short so the
// suite fails fast instead of hanging.
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  // The app's static server URL. Step definitions resolve this at runtime,
  // but keeping it here documents the canonical value.
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:8080',
    viewport: { width: 1280, height: 720 },
    locale: 'en-US',
    timezoneId: 'UTC',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
