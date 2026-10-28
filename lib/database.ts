import "server-only";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";

const globalForDatabase = globalThis as typeof globalThis & { walletDatabase?: Pool };

function createDatabasePool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required to connect to PostgreSQL.");

  const url = new URL(connectionString);
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must be a PostgreSQL connection string.");
  }

  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  const sslMode = url.searchParams.get("sslmode");
  const caPath = url.searchParams.get("sslrootcert");
  const environmentCa = process.env.DATABASE_SSL_CA?.trim();
  const ca = environmentCa || (caPath ? readFileSync(resolve(process.cwd(), caPath), "utf8") : undefined);

  if (!local && sslMode !== "verify-full") {
    throw new Error("Hosted PostgreSQL requires sslmode=verify-full in DATABASE_URL.");
  }
  if (!local && !ca) {
    throw new Error("Hosted PostgreSQL requires DATABASE_SSL_CA or a local sslrootcert path in DATABASE_URL.");
  }

  // Keep TLS settings out of the URL after loading them. node-postgres otherwise
  // replaces the explicit SSL object with the parsed URL options.
  url.searchParams.delete("sslmode");
  url.searchParams.delete("sslrootcert");

  return new Pool({
    connectionString: url.toString(),
    ...(sslMode || ca ? { ssl: { ca, rejectUnauthorized: true } } : {}),
    max: 5,
  });
}

export const database = globalForDatabase.walletDatabase ?? createDatabasePool();

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.walletDatabase = database;
}
