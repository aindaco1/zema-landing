const { defineConfig } = require("@playwright/test");

const channel = process.env.PW_CHANNEL;
const testPort = process.env.PW_TEST_PORT || "4173";
const testBaseUrl = `http://127.0.0.1:${testPort}/`;

module.exports = defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: {
    timeout: 15_000
  },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    baseURL: testBaseUrl,
    browserName: "chromium",
    channel: channel || undefined,
    headless: true,
    viewport: { width: 1280, height: 720 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  webServer: {
    command: "./scripts/serve-test-site.sh",
    url: testBaseUrl,
    reuseExistingServer: false,
    timeout: 120_000
  }
});
