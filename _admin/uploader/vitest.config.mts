import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const wranglerConfigPath = fileURLToPath(new URL("./wrangler.jsonc", import.meta.url));

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: wranglerConfigPath },
      miniflare: {
        bindings: {
          GITHUB_APP_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nTEST_ONLY\n-----END PRIVATE KEY-----",
          MEDIA_SOURCE_TOKEN: "test-source-token",
          LOCAL_ADMIN_BYPASS: "test-admin-token",
        },
      },
    }),
  ],
  test: {
    include: ["_admin/uploader/test/**/*.spec.ts"],
    maxWorkers: 1,
    fileParallelism: false,
  },
});
