import assert from "node:assert/strict";
import test from "node:test";
import { loadEnvConfig } from "@next/env";
import pg from "pg";
import { findDemoRecordForOwner } from "../lib/issuer/demo-record-lookup";

loadEnvConfig(process.cwd());

const enabled = process.env.RUN_DATABASE_OWNERSHIP_TESTS === "1";
test("Supabase demo fixture ownership blocks cross-account lookups in both directions", { skip: !enabled }, async () => {
  const connectionString = process.env.DATABASE_URL;
  assert.ok(connectionString, "DATABASE_URL is required for the integration test");
  const url = new URL(connectionString);
  for (const key of ["sslrootcert", "sslcert", "sslkey", "sslmode"]) url.searchParams.delete(key);
  const pool = new pg.Pool({
    connectionString: url.toString(),
    ...(url.port === "6543" ? { query_mode: "simple" } : {}),
    max: 1,
    connectionTimeoutMillis: 15000,
  });

  try {
    const users = await pool.query(
      `SELECT id, lower(email) AS email FROM "user"
       WHERE lower(email) = ANY($1::text[])`,
      [["citizen.alpha@example.test", "citizen.beta@example.test"]],
    );
    const userId = new Map(users.rows.map((row) => [row.email, row.id]));
    const alphaId = userId.get("citizen.alpha@example.test");
    const betaId = userId.get("citizen.beta@example.test");
    assert.ok(alphaId, "create citizen.alpha@example.test before seeding demo fixtures");
    assert.ok(betaId, "create citizen.beta@example.test before seeding demo fixtures");

    const alphaRecord = await findDemoRecordForOwner(pool, alphaId, "demo-school-board", {
      studentName: "Aarav Sample", seatNumber: "DEMO-25001", examYear: 2025, educationLevel: "secondary",
    });
    const betaRecord = await findDemoRecordForOwner(pool, betaId, "demo-school-board", {
      studentName: "Isha Example", seatNumber: "DEMO-24002", examYear: 2024, educationLevel: "higher_secondary",
    });
    assert.equal(alphaRecord?.id, "demo-record-active-01");
    assert.equal(betaRecord?.id, "demo-record-active-02");

    const betaTryingAlpha = await findDemoRecordForOwner(pool, betaId, "demo-school-board", {
      studentName: "Aarav Sample", seatNumber: "DEMO-25001", examYear: 2025, educationLevel: "secondary",
    });
    const alphaTryingBeta = await findDemoRecordForOwner(pool, alphaId, "demo-school-board", {
      studentName: "Isha Example", seatNumber: "DEMO-24002", examYear: 2024, educationLevel: "higher_secondary",
    });
    assert.equal(betaTryingAlpha, null);
    assert.equal(alphaTryingBeta, null);
  } finally {
    await pool.end();
  }
});
