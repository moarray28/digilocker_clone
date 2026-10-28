
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

  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);

  // Remove certificate file options so node-postgres does not
  // attempt to load a certificate from the deployment filesystem.
  url.searchParams.delete("sslrootcert");
  url.searchParams.delete("sslcert");
  url.searchParams.delete("sslkey");
  url.searchParams.delete("sslmode");

  return new Pool({
    connectionString: url.toString(),

    // Local development can use a non-TLS local database.
    // Hosted Supabase connections must use TLS.
    ssl: local
      ? undefined
      : {
          rejectUnauthorized: true,
        },

    // Keep the per-instance connection count low on Vercel.
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
