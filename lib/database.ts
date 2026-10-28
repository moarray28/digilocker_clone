
import "server-only";
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

  // This demo uses a plain PostgreSQL connection. Strip SSL URL parameters so
  // node-postgres cannot re-enable TLS from DATABASE_URL.
  url.searchParams.delete("sslrootcert");
  url.searchParams.delete("sslcert");
  url.searchParams.delete("sslkey");
  url.searchParams.delete("sslmode");

  return new Pool({
    connectionString: url.toString(),

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
