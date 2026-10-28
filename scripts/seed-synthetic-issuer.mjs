import { readFile } from "node:fs/promises";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
const { database } = await import("../lib/database.ts");

const sql = await readFile(new URL("../db/seeds/001_synthetic_issuer.sql", import.meta.url), "utf8");
try {
  await database.query(sql);
  console.log("Synthetic issuer and five demo certificate scenarios are ready.");
} finally {
  await database.end();
}
