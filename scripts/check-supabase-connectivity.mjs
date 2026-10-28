import nextEnv from "@next/env";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Pool } from "pg";

nextEnv.loadEnvConfig(process.cwd());

let failed = false;
const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
const legacyKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const apiKey = secretKey || legacyKey;
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "certificate-files";

if (!supabaseUrl || !apiKey) {
  console.log("Storage API: not checked; SUPABASE_URL or a server-only Storage key is missing.");
  failed = true;
} else {
  try {
    const headers = new Headers({ apikey: apiKey });
    if (!apiKey.startsWith("sb_secret_")) headers.set("Authorization", `Bearer ${apiKey}`);
    const response = await fetch(`${supabaseUrl}/storage/v1/bucket`, { headers, cache: "no-store" });
    if (!response.ok) {
      console.log(`Storage API: request reached Supabase but returned HTTP ${response.status}. Check the key and project URL.`);
      failed = true;
    } else {
      const buckets = await response.json();
      const bucket = Array.isArray(buckets) ? buckets.find((item) => item?.name === bucketName) : null;
      if (!bucket) {
        console.log("Storage API: connected; configured bucket was not found.");
        failed = true;
      } else if (bucket.public !== false) {
        console.log("Storage API: connected; configured bucket is not private.");
        failed = true;
      } else {
        console.log("Storage API: connected; configured bucket exists and is private.");
      }
    }
  } catch {
    console.log("Storage API: connection failed. Check network access and Supabase configuration.");
    failed = true;
  }
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.log("PostgreSQL: not checked; DATABASE_URL is missing.");
  failed = true;
} else {
  let pool;
  try {
    const url = new URL(databaseUrl);
    const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    const sslMode = url.searchParams.get("sslmode");
    const certificatePath = url.searchParams.get("sslrootcert");
    const ca = process.env.DATABASE_SSL_CA?.trim()
      || (certificatePath ? await readFile(resolve(process.cwd(), certificatePath), "utf8") : undefined);
    url.searchParams.delete("sslmode");
    url.searchParams.delete("sslrootcert");
    url.searchParams.delete("sslcert");
    url.searchParams.delete("sslkey");
    pool = new Pool({
      connectionString: url.toString(),
      ssl: local ? undefined : { ...(ca ? { ca } : {}), rejectUnauthorized: true },
      max: 1,
      connectionTimeoutMillis: 10000,
    });
    await pool.query("SELECT 1");
    console.log("PostgreSQL: connected with the TLS settings from DATABASE_URL.");
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error && typeof error.code === "string"
      ? error.code
      : "UNKNOWN";
    console.log(`PostgreSQL: connection failed (${code}). Check DATABASE_URL and DATABASE_SSL_CA.`);
    failed = true;
  } finally {
    await pool?.end();
  }
}

if (failed) process.exitCode = 1;
