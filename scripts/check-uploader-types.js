const path = require("node:path");
const { spawnSync } = require("node:child_process");

const uploaderRoot = path.resolve(__dirname, "../_admin/uploader");
const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["wrangler", "types", "worker-configuration.d.ts", "--env-file", ".dev.vars.example", "--check"],
  { cwd: uploaderRoot, stdio: "inherit" },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
