import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import { createScriptDatabasePool } from "./database-pool.mjs";

nextEnv.loadEnvConfig(process.cwd());
const database = createScriptDatabasePool();

const client = await database.connect();
try {
  const authSchema = await client.query("SELECT to_regclass('public.\"user\"') AS users_table");
  if (!authSchema.rows[0]?.users_table) {
    throw new Error("Better Auth tables are missing. Run npm run db:auth:migrate first.");
  }

  await client.query(`
    CREATE TABLE IF NOT EXISTS app_schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const directory = fileURLToPath(new URL("../db/migrations/", import.meta.url));
  const files = (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort();
  for (const name of files) {
    const applied = await client.query("SELECT 1 FROM app_schema_migrations WHERE name = $1", [name]);
    if (applied.rowCount) continue;

    await client.query("BEGIN");
    try {
      const sql = await readFile(join(directory, name), "utf8");
      await client.query(sql);
      await client.query("INSERT INTO app_schema_migrations (name) VALUES ($1)", [name]);
      await client.query("COMMIT");
      console.log(`Applied ${name}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  client.release();
  await database.end();
}
