import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  outputDir: "./.conversion-test-results/playwright",
  testMatch: /(?:conversion-tracking|google-customer-reviews|home-products-order)\.spec\.js/,
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3107",
    viewport: { width: 390, height: 844 },
    serviceWorkers: "block",
  },
  webServer: {
    command: "node node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3107",
    url: "http://127.0.0.1:3107",
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      MONGODB_URI: "mongodb://127.0.0.1:1/seraj_isolated_test?serverSelectionTimeoutMS=100",
      NEXTAUTH_SECRET: "local-test-only-not-a-production-secret",
      CLOUDINARY_CLOUD_NAME: "local-test",
      CLOUDINARY_API_KEY: "local-test",
      CLOUDINARY_API_SECRET: "local-test",
      ADMIN_EMAIL: "local-test@example.com",
      ADMIN_PASSWORD_HASH: "local-test-login-disabled",
      GA4_API_SECRET: "",
    },
  },
});
