import { createRemoteJWKSet, importPKCS8, jwtVerify, SignJWT } from "jose";
import { timingSafeEqual } from "node:crypto";
import manifestJson from "../../media-slots.json";

type UnknownRecord = Record<string, unknown>;

type MediaOutput = {
  role: string;
  path: string;
  contentPath: string;
  width?: number;
  height?: number;
  crf?: number;
  quality?: number;
  codec?: string;
  bitrate?: string;
};

type MediaSlot = {
  id: string;
  label: string;
  description: string;
  kind: "video" | "audio" | "image";
  maxBytes: number;
  maxDurationSeconds?: number;
  acceptedExtensions: string[];
  acceptedCodecs?: string[];
  maxWidth?: number;
  maxHeight?: number;
  focalPaths?: { x: string; y: string };
  outputs: MediaOutput[];
};

type MediaManifest = {
  version: number;
  upload: {
    r2Prefix: string;
    partSizeBytes: number;
    maxConcurrentParts: number;
    retentionDays: number;
  };
  slots: MediaSlot[];
};

type UploadIdentity = {
  user: string;
};

type ReleasePayload = {
  version: 1;
  jobId: string;
  slotId: string;
  sourceKey: string;
  fileName: string;
  size: number;
  contentType: string;
  focalX: number;
  focalY: number;
  triggeredBy: string;
};

const manifest = manifestJson as MediaManifest;
const JSON_LIMIT_BYTES = 64 * 1024;
const GITHUB_API_VERSION = "2026-03-10";

class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(record: UnknownRecord, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || !value.trim()) throw new HttpError(400, "INVALID_INPUT", `${key} is required`);
  return value;
}

function requiredNumber(record: UnknownRecord, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) throw new HttpError(400, "INVALID_INPUT", `${key} must be a number`);
  return value;
}

async function readBoundedJson(request: Request): Promise<UnknownRecord> {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > JSON_LIMIT_BYTES) throw new HttpError(413, "PAYLOAD_TOO_LARGE", "Request metadata is too large");
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > JSON_LIMIT_BYTES) throw new HttpError(413, "PAYLOAD_TOO_LARGE", "Request metadata is too large");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new HttpError(400, "INVALID_JSON", "Request body must be valid JSON");
  }
  if (!isRecord(value)) throw new HttpError(400, "INVALID_INPUT", "Request body must be an object");
  return value;
}

function responseHeaders(contentType = "application/json; charset=utf-8"): Headers {
  return new Headers({
    "Cache-Control": "no-store",
    "Content-Type": contentType,
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  });
}

function jsonResponse(value: unknown, status = 200): Response {
  return Response.json(value, { status, headers: responseHeaders() });
}

function errorResponse(error: unknown, pathname: string): Response {
  if (error instanceof HttpError) return jsonResponse({ error: error.message, code: error.code }, error.status);
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(JSON.stringify({ event: "request_failed", pathname, error: message }));
  return jsonResponse({ error: "The uploader could not complete this request", code: "INTERNAL_ERROR" }, 500);
}

function findSlot(slotId: string): MediaSlot {
  const slot = manifest.slots.find((candidate) => candidate.id === slotId);
  if (!slot) throw new HttpError(400, "INVALID_SLOT", "Unknown media slot");
  return slot;
}

function sanitizeFileName(fileName: string): string {
  const safe = fileName.normalize("NFKD").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!safe || safe.length > 180) throw new HttpError(400, "INVALID_FILE", "File name is invalid or too long");
  return safe;
}

function fileExtension(fileName: string): string {
  const match = /\.([^.]+)$/.exec(fileName);
  return match ? match[1]!.toLowerCase() : "";
}

function validateFocal(value: number, label: string): number {
  if (value < 0 || value > 100) throw new HttpError(400, "INVALID_FOCAL_POINT", `${label} must be between 0 and 100`);
  return value;
}

function validateSourceKey(key: string, jobId?: string, slotId?: string): void {
  const prefix = `${manifest.upload.r2Prefix}/`;
  if (!key.startsWith(prefix) || key.includes("..") || key.includes("\\")) throw new HttpError(400, "INVALID_SOURCE_KEY", "Source key is invalid");
  if (jobId && !key.startsWith(`${prefix}${slotId}/${jobId}/`)) throw new HttpError(400, "INVALID_SOURCE_KEY", "Source key does not match this upload");
}

async function secureEqual(provided: string, expected: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  return timingSafeEqual(new Uint8Array(providedHash), new Uint8Array(expectedHash));
}

function sameOriginMutation(request: Request): void {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;
  const origin = request.headers.get("origin");
  const expected = new URL(request.url).origin;
  if (!origin || origin !== expected) throw new HttpError(403, "INVALID_ORIGIN", "Cross-origin requests are not allowed");
}

async function authenticateAdmin(request: Request, env: Env): Promise<UploadIdentity> {
  const url = new URL(request.url);
  const localHost = url.hostname === "127.0.0.1" || url.hostname === "localhost";
  const localToken = request.headers.get("x-zema-local-admin") || "";
  if (localHost && env.LOCAL_ADMIN_BYPASS && await secureEqual(localToken, env.LOCAL_ADMIN_BYPASS)) {
    return { user: "local developer" };
  }

  if (!env.POLICY_AUD || env.POLICY_AUD.startsWith("REPLACE_") || !env.TEAM_DOMAIN.startsWith("https://")) {
    throw new HttpError(403, "ACCESS_NOT_CONFIGURED", "Cloudflare Access is not configured");
  }
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) throw new HttpError(403, "ACCESS_REQUIRED", "Cloudflare Access authentication is required");

  try {
    const jwks = createRemoteJWKSet(new URL(`${env.TEAM_DOMAIN}/cdn-cgi/access/certs`));
    const { payload } = await jwtVerify(token, jwks, {
      issuer: env.TEAM_DOMAIN,
      audience: env.POLICY_AUD,
    });
    if (typeof payload.email !== "string" || !payload.email) throw new Error("Access token has no email identity");
    return { user: payload.email };
  } catch {
    throw new HttpError(403, "INVALID_ACCESS_TOKEN", "Cloudflare Access authentication is invalid");
  }
}

function assertSecretConfiguration(env: Env): void {
  if (typeof env.GITHUB_APP_PRIVATE_KEY !== "string" || !env.GITHUB_APP_PRIVATE_KEY.includes("BEGIN PRIVATE KEY")) {
    throw new HttpError(503, "GITHUB_APP_NOT_CONFIGURED", "GitHub App signing is not configured");
  }
  if (env.GITHUB_APP_CLIENT_ID.startsWith("REPLACE_")) throw new HttpError(503, "GITHUB_APP_NOT_CONFIGURED", "GitHub App client ID is not configured");
  if (env.GITHUB_APP_INSTALLATION_ID.startsWith("REPLACE_")) throw new HttpError(503, "GITHUB_APP_NOT_CONFIGURED", "GitHub App installation is not configured");
}

async function githubInstallationToken(env: Env): Promise<string> {
  assertSecretConfiguration(env);
  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(env.GITHUB_APP_PRIVATE_KEY, "RS256");
  const appJwt = await new SignJWT({})
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuedAt(now - 60)
    .setIssuer(env.GITHUB_APP_CLIENT_ID)
    .setExpirationTime(now + 540)
    .sign(key);

  const response = await fetch(`https://api.github.com/app/installations/${encodeURIComponent(env.GITHUB_APP_INSTALLATION_ID)}/access_tokens`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${appJwt}`,
      "User-Agent": "zema-media-uploader",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
    },
  });
  const body: unknown = await response.json();
  if (!response.ok || !isRecord(body) || typeof body.token !== "string") {
    throw new HttpError(502, "GITHUB_AUTH_FAILED", "GitHub App authentication failed");
  }
  return body.token;
}

async function dispatchMediaRelease(env: Env, payload: ReleasePayload): Promise<string | null> {
  const token = await githubInstallationToken(env);
  const workflow = encodeURIComponent(env.GITHUB_WORKFLOW);
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(env.GITHUB_OWNER)}/${encodeURIComponent(env.GITHUB_REPO)}/actions/workflows/${workflow}/dispatches`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "zema-media-uploader",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
    },
    body: JSON.stringify({ ref: env.GITHUB_REF, inputs: { payload: JSON.stringify(payload) } }),
  });
  if (!response.ok) throw new HttpError(502, "GITHUB_DISPATCH_FAILED", "GitHub did not accept the release request");
  if (response.status === 204) {
    return `https://github.com/${encodeURIComponent(env.GITHUB_OWNER)}/${encodeURIComponent(env.GITHUB_REPO)}/actions/workflows/${encodeURIComponent(env.GITHUB_WORKFLOW)}`;
  }
  const body: unknown = await response.json();
  if (!isRecord(body)) return null;
  return typeof body.html_url === "string" ? body.html_url : null;
}

function parseParts(value: unknown, expectedCount: number): R2UploadedPart[] {
  if (!Array.isArray(value) || value.length !== expectedCount) throw new HttpError(400, "INVALID_PARTS", "Multipart upload is incomplete");
  const parts = value.map((part, index) => {
    if (!isRecord(part) || part.partNumber !== index + 1 || typeof part.etag !== "string" || !part.etag) {
      throw new HttpError(400, "INVALID_PARTS", "Multipart upload parts are invalid");
    }
    return { partNumber: index + 1, etag: part.etag };
  });
  return parts;
}

async function startUpload(request: Request, env: Env): Promise<Response> {
  const body = await readBoundedJson(request);
  const slot = findSlot(requiredString(body, "slotId"));
  const originalName = requiredString(body, "fileName");
  const fileName = sanitizeFileName(originalName);
  const size = requiredNumber(body, "size");
  const contentType = requiredString(body, "contentType");
  const focalX = validateFocal(requiredNumber(body, "focalX"), "focalX");
  const focalY = validateFocal(requiredNumber(body, "focalY"), "focalY");
  const extension = fileExtension(fileName);
  if (!slot.acceptedExtensions.includes(extension)) throw new HttpError(400, "UNSUPPORTED_FILE", `.${extension || "unknown"} is not accepted for this slot`);
  if (!Number.isSafeInteger(size) || size <= 0 || size > slot.maxBytes) throw new HttpError(400, "INVALID_FILE_SIZE", "File size is outside this slot's limit");

  const jobId = crypto.randomUUID();
  const key = `${manifest.upload.r2Prefix}/${slot.id}/${jobId}/${fileName}`;
  const multipart = await env.MEDIA_BUCKET.createMultipartUpload(key, {
    httpMetadata: { contentType },
    customMetadata: {
      jobId,
      slotId: slot.id,
      originalName,
      expectedSize: String(size),
      focalX: String(focalX),
      focalY: String(focalY),
    },
  });
  console.log(JSON.stringify({ event: "upload_started", jobId, slotId: slot.id, size }));
  return jsonResponse({ jobId, key, uploadId: multipart.uploadId });
}

async function uploadPart(request: Request, env: Env, jobId: string, partNumberText: string): Promise<Response> {
  const url = new URL(request.url);
  const key = url.searchParams.get("key") || "";
  const uploadId = url.searchParams.get("uploadId") || "";
  const slotId = key.split("/")[1] || "";
  findSlot(slotId);
  validateSourceKey(key, jobId, slotId);
  if (!uploadId || uploadId.length > 512) throw new HttpError(400, "INVALID_UPLOAD", "Upload ID is invalid");
  const partNumber = Number(partNumberText);
  if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10_000) throw new HttpError(400, "INVALID_PART", "Part number is invalid");
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0 || contentLength > manifest.upload.partSizeBytes) {
    throw new HttpError(413, "INVALID_PART_SIZE", "Upload part is empty or exceeds the configured part size");
  }
  if (!request.body) throw new HttpError(400, "EMPTY_PART", "Upload part is empty");
  const multipart = env.MEDIA_BUCKET.resumeMultipartUpload(key, uploadId);
  const part = await multipart.uploadPart(partNumber, request.body);
  return jsonResponse({ partNumber: part.partNumber, etag: part.etag });
}

async function cancelUpload(request: Request, env: Env): Promise<Response> {
  const body = await readBoundedJson(request);
  const key = requiredString(body, "key");
  const uploadId = requiredString(body, "uploadId");
  const jobId = requiredString(body, "jobId");
  const slotId = key.split("/")[1] || "";
  findSlot(slotId);
  validateSourceKey(key, jobId, slotId);
  await env.MEDIA_BUCKET.resumeMultipartUpload(key, uploadId).abort();
  console.log(JSON.stringify({ event: "upload_cancelled", jobId, slotId }));
  return jsonResponse({ cancelled: true });
}

async function completeUpload(request: Request, env: Env, identity: UploadIdentity): Promise<Response> {
  const body = await readBoundedJson(request);
  const jobId = requiredString(body, "jobId");
  const slotId = requiredString(body, "slotId");
  const slot = findSlot(slotId);
  const key = requiredString(body, "key");
  const uploadId = requiredString(body, "uploadId");
  const fileName = sanitizeFileName(requiredString(body, "fileName"));
  const size = requiredNumber(body, "size");
  const contentType = requiredString(body, "contentType");
  const focalX = validateFocal(requiredNumber(body, "focalX"), "focalX");
  const focalY = validateFocal(requiredNumber(body, "focalY"), "focalY");
  validateSourceKey(key, jobId, slotId);
  if (!key.endsWith(`/${fileName}`)) throw new HttpError(400, "INVALID_FILE", "Completed file name does not match the upload");
  if (!slot.acceptedExtensions.includes(fileExtension(fileName))) throw new HttpError(400, "UNSUPPORTED_FILE", "Completed file type is not accepted for this slot");
  if (size <= 0 || size > slot.maxBytes) throw new HttpError(400, "INVALID_FILE_SIZE", "Completed upload size is invalid");
  const expectedCount = Math.ceil(size / manifest.upload.partSizeBytes);
  const parts = parseParts(body.parts, expectedCount);
  const object = await env.MEDIA_BUCKET.resumeMultipartUpload(key, uploadId).complete(parts);
  if (object.size !== size) {
    await env.MEDIA_BUCKET.delete(key);
    throw new HttpError(400, "SIZE_MISMATCH", "Completed upload size does not match the selected file");
  }

  const payload: ReleasePayload = {
    version: 1,
    jobId,
    slotId,
    sourceKey: key,
    fileName,
    size,
    contentType,
    focalX,
    focalY,
    triggeredBy: identity.user,
  };
  const runUrl = await dispatchMediaRelease(env, payload);
  console.log(JSON.stringify({ event: "release_dispatched", jobId, slotId, size }));
  return jsonResponse({ completed: true, runUrl });
}

async function servePipelineSource(request: Request, env: Env): Promise<Response> {
  const authorization = request.headers.get("authorization") || "";
  const provided = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!provided || !await secureEqual(provided, env.MEDIA_SOURCE_TOKEN)) throw new HttpError(403, "SOURCE_AUTH_REQUIRED", "Source authentication failed");
  const key = new URL(request.url).searchParams.get("key") || "";
  validateSourceKey(key);
  const object = await env.MEDIA_BUCKET.get(key);
  if (!object) throw new HttpError(404, "SOURCE_NOT_FOUND", "Source object was not found");
  const headers = responseHeaders(object.httpMetadata?.contentType || "application/octet-stream");
  object.writeHttpMetadata(headers);
  headers.set("Content-Length", String(object.size));
  headers.set("ETag", object.httpEtag);
  return new Response(request.method === "HEAD" ? null : object.body, { status: 200, headers });
}

async function serveAdminAsset(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const assetUrl = new URL(request.url);
  // Fetch the asset root for the admin shell. Cloudflare Assets canonicalizes
  // `/index.html` to `/`; requesting that path here would bounce between the
  // asset redirect and the public `/` -> `/admin/` redirect below.
  assetUrl.pathname = url.pathname === "/admin/" ? "/" : url.pathname.replace(/^\/admin/, "") || "/";
  const assetResponse = await env.ASSETS.fetch(new Request(assetUrl, request));
  const headers = new Headers(assetResponse.headers);
  for (const [name, value] of responseHeaders()) {
    if (name.toLowerCase() !== "content-type") headers.set(name, value);
  }
  headers.set("Cache-Control", url.pathname === "/admin/" ? "no-store" : "private, max-age=300");
  headers.set("Content-Security-Policy", "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
  return new Response(assetResponse.body, { status: assetResponse.status, statusText: assetResponse.statusText, headers });
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const deploymentRole: string = env.DEPLOYMENT_ROLE;
  if (deploymentRole === "source") {
    if (url.pathname === "/health") return jsonResponse({ status: "ok", role: "source" });
    if (url.pathname === "/pipeline/source" && (request.method === "GET" || request.method === "HEAD")) {
      return servePipelineSource(request, env);
    }
    throw new HttpError(404, "NOT_FOUND", "Not found");
  }
  if (deploymentRole !== "admin") throw new HttpError(503, "ROLE_NOT_CONFIGURED", "Worker deployment role is not configured");
  if (url.pathname === "/") return Response.redirect(`${url.origin}/admin/`, 302);
  if (url.pathname === "/health") return jsonResponse({ status: "ok", role: "admin", accessConfigured: !env.POLICY_AUD.startsWith("REPLACE_") });
  if (!url.pathname.startsWith("/admin")) throw new HttpError(404, "NOT_FOUND", "Not found");

  const identity = await authenticateAdmin(request, env);
  sameOriginMutation(request);

  if (url.pathname === "/admin/api/slots" && request.method === "GET") {
    return jsonResponse({
      user: identity.user,
      upload: manifest.upload,
      slots: manifest.slots.map((slot) => ({
        id: slot.id,
        label: slot.label,
        description: slot.description,
        kind: slot.kind,
        maxBytes: slot.maxBytes,
        maxDurationSeconds: slot.maxDurationSeconds,
        acceptedExtensions: slot.acceptedExtensions,
        maxWidth: slot.maxWidth,
        maxHeight: slot.maxHeight,
        hasFocalPoint: Boolean(slot.focalPaths),
      })),
    });
  }
  if (url.pathname === "/admin/api/uploads" && request.method === "POST") return startUpload(request, env);
  if (url.pathname === "/admin/api/uploads" && request.method === "DELETE") return cancelUpload(request, env);
  if (url.pathname === "/admin/api/uploads/complete" && request.method === "POST") return completeUpload(request, env, identity);
  const partMatch = /^\/admin\/api\/uploads\/([0-9a-f-]{36})\/parts\/(\d+)$/.exec(url.pathname);
  if (partMatch && request.method === "PUT") return uploadPart(request, env, partMatch[1]!, partMatch[2]!);
  if (url.pathname.startsWith("/admin/api/")) throw new HttpError(404, "NOT_FOUND", "API route not found");
  if (request.method !== "GET" && request.method !== "HEAD") throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method not allowed");
  return serveAdminAsset(request, env);
}

async function workerFetch(request: Request, env: Env): Promise<Response> {
  const pathname = new URL(request.url).pathname;
  try {
    return await handleRequest(request, env);
  } catch (error) {
    return errorResponse(error, pathname);
  }
}

export default { fetch: workerFetch } satisfies ExportedHandler<Env>;

export { handleRequest, secureEqual, workerFetch };
