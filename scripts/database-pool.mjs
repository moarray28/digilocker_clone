import { Pool } from "pg";

export function createScriptDatabasePool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for database scripts.");

  const url = new URL(connectionString);
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must be a PostgreSQL connection string.");
  }
  for (const key of ["sslrootcert", "sslcert", "sslkey", "sslmode"]) url.searchParams.delete(key);

  return new Pool({
    connectionString: url.toString(),
    ...(url.port === "6543" ? { query_mode: "simple" } : {}),
    max: 1,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
  });
}
