const fs = require("node:fs");
const path = require("node:path");

const root = process.env.MEDIA_REPOSITORY_ROOT
  ? path.resolve(process.env.MEDIA_REPOSITORY_ROOT)
  : path.resolve(__dirname, "../..");
const manifestPath = path.join(root, "_admin/media-slots.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

function parseReleasePayload(serialized = process.env.MEDIA_RELEASE_PAYLOAD) {
  if (!serialized) throw new Error("MEDIA_RELEASE_PAYLOAD is required");
  let value;
  try {
    value = JSON.parse(serialized);
  } catch {
    throw new Error("MEDIA_RELEASE_PAYLOAD must be valid JSON");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Media release payload must be an object");
  const requiredStrings = ["jobId", "slotId", "sourceKey", "fileName", "contentType", "triggeredBy"];
  for (const key of requiredStrings) {
    if (typeof value[key] !== "string" || !value[key].trim()) throw new Error(`Media release payload is missing ${key}`);
  }
  if (value.version !== 1) throw new Error("Unsupported media release payload version");
  if (!/^[0-9a-f-]{36}$/.test(value.jobId)) throw new Error("Media release job ID is invalid");
  if (!Number.isSafeInteger(value.size) || value.size <= 0) throw new Error("Media release size is invalid");
  for (const key of ["focalX", "focalY"]) {
    if (!Number.isFinite(value[key]) || value[key] < 0 || value[key] > 100) throw new Error(`${key} must be between 0 and 100`);
  }
  const slot = manifest.slots.find((candidate) => candidate.id === value.slotId);
  if (!slot) throw new Error(`Unknown media slot: ${value.slotId}`);
  const expectedPrefix = `${manifest.upload.r2Prefix}/${slot.id}/${value.jobId}/`;
  if (!value.sourceKey.startsWith(expectedPrefix) || value.sourceKey.includes("..") || value.sourceKey.includes("\\")) {
    throw new Error("Media release source key does not match its slot and job");
  }
  const extension = path.extname(value.fileName).slice(1).toLowerCase();
  if (!slot.acceptedExtensions.includes(extension)) throw new Error(`.${extension || "unknown"} is not accepted for ${slot.id}`);
  if (value.size > slot.maxBytes) throw new Error(`Source exceeds the ${slot.id} size limit`);
  return { payload: value, slot };
}

function resolveRepositoryPath(relativePath) {
  const resolved = path.resolve(root, relativePath);
  if (!resolved.startsWith(`${root}${path.sep}`)) throw new Error(`Path escapes repository: ${relativePath}`);
  return resolved;
}

function setAtPath(value, dottedPath, nextValue) {
  const segments = dottedPath.split(".");
  let current = value;
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = /^\d+$/.test(segments[index]) ? Number(segments[index]) : segments[index];
    current = current[segment];
    if (!current || typeof current !== "object") throw new Error(`Content path does not exist: ${dottedPath}`);
  }
  const finalSegment = segments.at(-1);
  const key = /^\d+$/.test(finalSegment) ? Number(finalSegment) : finalSegment;
  current[key] = nextValue;
}

module.exports = {
  manifest,
  parseReleasePayload,
  resolveRepositoryPath,
  root,
  setAtPath,
};
