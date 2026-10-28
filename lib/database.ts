
import "server-only";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";

const globalForDatabase = globalThis as typeof globalThis & {
  walletDatabase?: Pool;
};

function createDatabasePool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to connect to PostgreSQL.");
  }

  const url = new URL(connectionString);

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must be a PostgreSQL connection string.");
  }

  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  const sslMode = url.searchParams.get("sslmode");
  const certificatePath = url.searchParams.get("sslrootcert");
  const ca = process.env.DATABASE_SSL_CA?.trim()
    || (certificatePath ? readFileSync(resolve(process.cwd(), certificatePath), "utf8") : undefined);
  const transactionPooler = url.port === "6543"
    && url.hostname.endsWith(".pooler.supabase.com");

  if (!local && transactionPooler && sslMode === "verify-full" && !ca) {
    throw new Error("sslmode=verify-full requires DATABASE_SSL_CA or sslrootcert.");
  }
  if (!local && !transactionPooler && !ca && sslMode !== "require" && sslMode !== "no-verify") {
    throw new Error("Use sslmode=require for the Vercel transaction pooler, or set DATABASE_SSL_CA to verify the certificate.");
  }

  // node-postgres replaces the explicit SSL object when these options remain
  // in the connection URL, so load the CA above and remove the TLS parameters.
  url.searchParams.delete("sslrootcert");
  url.searchParams.delete("sslcert");
  url.searchParams.delete("sslkey");
  url.searchParams.delete("sslmode");

  return new Pool({
    connectionString: url.toString(),

    // Supabase's shared transaction pooler uses TLS. CA verification is
    // optional; when configured, verify the server certificate and hostname.
    ssl: local ? undefined : ca
      ? { ca, rejectUnauthorized: true }
      : { rejectUnauthorized: false },

    // Keep the per-instance connection count low on Vercel. Transaction-mode
    // Supavisor does not support named prepared statements.
    ...(url.port === "6543" ? { query_mode: "simple" as const } : {}),
    max: 1,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
  });
}

export const database =
  globalForDatabase.walletDatabase ?? createDatabasePool();

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.walletDatabase = database;
}
