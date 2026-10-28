import "server-only";

const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "certificate-files";

function encodedPath(value: string) {
  return value.split("/").map(encodeURIComponent).join("/");
}

function storageConfig() {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!base || !key) throw new Error("Private document storage is not configured.");
  return { base, key, legacyJwtKey: !key.startsWith("sb_secret_") };
}

function apiHeaders(key: string, legacyJwtKey: boolean, contentType?: string) {
  const headers = new Headers({ apikey: key });
  if (legacyJwtKey) headers.set("Authorization", `Bearer ${key}`);
  if (contentType) headers.set("Content-Type", contentType);
  return headers;
}

export async function uploadPrivatePdf(objectKey: string, bytes: Uint8Array) {
  const { base, key, legacyJwtKey } = storageConfig();
  const response = await fetch(`${base}/storage/v1/object/${encodedPath(bucket)}/${encodedPath(objectKey)}`, {
    method: "POST",
    headers: { ...Object.fromEntries(apiHeaders(key, legacyJwtKey, "application/pdf")), "x-upsert": "false" },
    body: Buffer.from(bytes),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Private document upload failed.");
}

export async function downloadPrivatePdf(objectKey: string): Promise<Uint8Array> {
  const { base, key, legacyJwtKey } = storageConfig();
  const response = await fetch(`${base}/storage/v1/object/authenticated/${encodedPath(bucket)}/${encodedPath(objectKey)}`, {
    headers: apiHeaders(key, legacyJwtKey),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Private document download failed.");
  return new Uint8Array(await response.arrayBuffer());
}

export async function removePrivatePdf(objectKey: string) {
  const { base, key, legacyJwtKey } = storageConfig();
  const response = await fetch(`${base}/storage/v1/object/${encodedPath(bucket)}`, {
    method: "DELETE",
    headers: apiHeaders(key, legacyJwtKey, "application/json"),
    body: JSON.stringify({ prefixes: [objectKey] }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Private document cleanup failed.");
}
