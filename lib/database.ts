
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

  // node-postgres replaces the explicit SSL object when these options remain
  // in the connection URL, so load the CA above and remove the TLS parameters.
  url.searchParams.delete("sslrootcert");
  url.searchParams.delete("sslcert");
  url.searchParams.delete("sslkey");
  url.searchParams.delete("sslmode");

  return new Pool({
    connectionString: url.toString(),

    // Hosted PostgreSQL always uses verified TLS. Node's built-in trust store
    // is used by default; DATABASE_SSL_CA/sslrootcert can add a Supabase CA.
    ssl: local ? undefined : {
      ...(ca ? { ca } : {}),
      rejectUnauthorized: true,
    },

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
