const fs = require("node:fs");
const path = require("node:path");
const { Readable } = require("node:stream");
const { pipeline } = require("node:stream/promises");
const { parseReleasePayload } = require("./contract");

async function main() {
  const endpoint = process.env.MEDIA_SOURCE_URL;
  const token = process.env.MEDIA_SOURCE_TOKEN;
  const destination = process.argv[2];
  if (!endpoint || !/^https:\/\//.test(endpoint)) throw new Error("MEDIA_SOURCE_URL must be an HTTPS origin");
  if (!token) throw new Error("MEDIA_SOURCE_TOKEN is required");
  if (!destination || !path.isAbsolute(destination)) throw new Error("An absolute destination path is required");
  const { payload } = parseReleasePayload();

  const sourceUrl = new URL("/pipeline/source", endpoint);
  sourceUrl.searchParams.set("key", payload.sourceKey);
  const response = await fetch(sourceUrl, {
    headers: {
      Accept: "application/octet-stream",
      Authorization: `Bearer ${token}`,
    },
    redirect: "error",
  });
  if (!response.ok || !response.body) throw new Error(`Source download failed with HTTP ${response.status}`);
  const advertisedSize = Number(response.headers.get("content-length") || "0");
  if (advertisedSize && advertisedSize !== payload.size) throw new Error("Source download size does not match the upload record");

  await fs.promises.mkdir(path.dirname(destination), { recursive: true });
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(destination, { flags: "wx", mode: 0o600 }));
  const downloaded = await fs.promises.stat(destination);
  if (downloaded.size !== payload.size) throw new Error(`Downloaded ${downloaded.size} bytes; expected ${payload.size}`);
  console.log(`Downloaded private source for ${payload.slotId} (${downloaded.size} bytes).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
