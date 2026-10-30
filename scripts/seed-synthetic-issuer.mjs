import { readdir, readFile } from "node:fs/promises";
import nextEnv from "@next/env";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { createScriptDatabasePool } from "./database-pool.mjs";

nextEnv.loadEnvConfig(process.cwd());
const database = createScriptDatabasePool();

const directory = fileURLToPath(new URL("../db/seeds/", import.meta.url));
const files = (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort();
const client = await database.connect();
try {
  await client.query("BEGIN");
  for (const file of files) {
    await client.query(await readFile(join(directory, file), "utf8"));
  }
  const assignments = await client.query(
    `SELECT count(*)::int AS count FROM issuer_test_record_owners
     WHERE issuer_record_id = ANY($1::text[])`,
    [[
      "demo-record-active-01", "demo-record-revoked-01", "demo-record-active-02",
      "demo-record-superseded-01", "demo-record-active-03", "demo-record-invalid-signature-01",
    ]],
  );
  if (assignments.rows[0]?.count !== 6) {
    throw new Error("Create the three demo accounts listed in docs-auth.md, then rerun npm run db:seed:issuer.");
  }
  await client.query("COMMIT");
  console.log("Six synthetic certificate fixtures are assigned to their demo accounts.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await database.end();
}
