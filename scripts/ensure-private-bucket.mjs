import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "certificate-files";

if (!base || !key) {
  console.error("Cannot configure Storage: SUPABASE_URL and a server-only Secret/service-role key are required.");
  process.exit(1);
}

function headers(contentType) {
  const result = new Headers({ apikey: key });
  if (!key.startsWith("sb_secret_")) result.set("Authorization", `Bearer ${key}`);
  if (contentType) result.set("Content-Type", contentType);
  return result;
}

async function listBuckets() {
  const response = await fetch(`${base}/storage/v1/bucket`, { headers: headers(), cache: "no-store" });
  if (!response.ok) throw new Error(`Storage bucket lookup returned HTTP ${response.status}.`);
  const buckets = await response.json();
  if (!Array.isArray(buckets)) throw new Error("Storage returned an unexpected bucket list.");
  return buckets;
}

try {
  const existing = (await listBuckets()).find((bucket) => bucket?.name === bucketName);
  if (existing) {
    if (existing.public !== false) {
      console.error("The configured bucket already exists but is public. It was left unchanged; make it private in Supabase Storage settings.");
      process.exitCode = 1;
    } else {
      console.log("The configured Storage bucket already exists and is private.");
    }
  } else {
    const response = await fetch(`${base}/storage/v1/bucket`, {
      method: "POST",
      headers: headers("application/json"),
      body: JSON.stringify({ name: bucketName, public: false, file_size_limit: 10_000_000, allowed_mime_types: ["application/pdf"] }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Private bucket creation returned HTTP ${response.status}.`);
    console.log("Created the configured bucket as private with PDF-only uploads and a 10 MB size limit.");
  }
} catch (error) {
  const message = error instanceof Error ? error.message : "Storage setup failed.";
  console.error(message);
  process.exitCode = 1;
}
