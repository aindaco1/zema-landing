import { env, exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const adminHeaders = {
  Origin: "http://localhost",
  "X-Zema-Local-Admin": "test-admin-token",
};

async function responseJson(response: Response): Promise<Record<string, unknown>> {
  const value: unknown = await response.json();
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Expected a JSON object");
  return value as Record<string, unknown>;
}

describe("ZEMA media uploader Worker", () => {
  it("fails closed when an admin request has no Access identity", async () => {
    const response = await exports.default.fetch("http://localhost/admin/api/slots");
    expect(response.status).toBe(403);
    expect(await responseJson(response)).toMatchObject({ code: "ACCESS_NOT_CONFIGURED" });
  });

  it("exposes the shared slot contract to an authenticated local admin", async () => {
    const response = await exports.default.fetch(new Request("http://localhost/admin/api/slots", { headers: adminHeaders }));
    expect(response.status).toBe(200);
    const body = await responseJson(response);
    expect(body.user).toBe("local developer");
    expect(body.upload).toMatchObject({ partSizeBytes: 20_971_520, retentionDays: 30 });
    expect(body.slots).toHaveLength(9);
  });

  it("rejects unsupported raw file types before creating an upload", async () => {
    const response = await exports.default.fetch(new Request("http://localhost/admin/api/uploads", {
      method: "POST",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        slotId: "hero-video",
        fileName: "wrong.txt",
        size: 100,
        contentType: "text/plain",
        focalX: 50,
        focalY: 50,
      }),
    }));
    expect(response.status).toBe(400);
    expect(await responseJson(response)).toMatchObject({ code: "UNSUPPORTED_FILE" });
  });

  it("creates and cancels a private R2 multipart upload", async () => {
    const startResponse = await exports.default.fetch(new Request("http://localhost/admin/api/uploads", {
      method: "POST",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        slotId: "hero-video",
        fileName: "hero.mov",
        size: 8_000_000,
        contentType: "video/quicktime",
        focalX: 48,
        focalY: 52,
      }),
    }));
    expect(startResponse.status).toBe(200);
    const started = await responseJson(startResponse);
    expect(started.key).toMatch(/^incoming\/hero-video\/[0-9a-f-]{36}\/hero\.mov$/);

    const cancelResponse = await exports.default.fetch(new Request("http://localhost/admin/api/uploads", {
      method: "DELETE",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ key: started.key, uploadId: started.uploadId, jobId: started.jobId }),
    }));
    expect(cancelResponse.status).toBe(200);
    expect(await responseJson(cancelResponse)).toMatchObject({ cancelled: true });
  });

  it("streams a private source only with the pipeline bearer token", async () => {
    const key = `incoming/hero-video/${crypto.randomUUID()}/source.mov`;
    await env.MEDIA_BUCKET.put(key, "raw-source", { httpMetadata: { contentType: "video/quicktime" } });

    const denied = await exports.default.fetch(`http://localhost/pipeline/source?key=${encodeURIComponent(key)}`);
    expect(denied.status).toBe(403);

    const allowed = await exports.default.fetch(new Request(`http://localhost/pipeline/source?key=${encodeURIComponent(key)}`, {
      headers: { Authorization: "Bearer test-source-token" },
    }));
    expect(allowed.status).toBe(200);
    expect(allowed.headers.get("content-type")).toBe("video/quicktime");
    expect(new TextDecoder().decode(await allowed.arrayBuffer())).toBe("raw-source");

    await env.MEDIA_BUCKET.delete(key);
  });
});
