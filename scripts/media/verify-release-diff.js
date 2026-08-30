const { spawnSync } = require("node:child_process");
const { parseReleasePayload } = require("./contract");

const { slot } = parseReleasePayload();
const result = spawnSync("git", ["diff", "--name-only", "--diff-filter=ACMR"], { encoding: "utf8" });
if (result.status !== 0) {
  console.error(result.stderr || "Could not inspect media release changes");
  process.exit(1);
}

const changed = result.stdout.trim().split("\n").filter(Boolean).sort();
const allowed = new Set(["_config.yml", "_data/frames.yml", ...slot.outputs.map((output) => output.path)]);
const unexpected = changed.filter((file) => !allowed.has(file));
const missing = slot.outputs.map((output) => output.path).filter((file) => !changed.includes(file));

if (unexpected.length || missing.length || !changed.includes("_config.yml")) {
  if (unexpected.length) console.error(`Unexpected release changes: ${unexpected.join(", ")}`);
  if (missing.length) console.error(`Missing generated outputs: ${missing.join(", ")}`);
  if (!changed.includes("_config.yml")) console.error("Media release did not update the asset version");
  process.exit(1);
}

console.log(`Media release diff is scoped to ${slot.id}: ${changed.join(", ")}`);
