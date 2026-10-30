import assert from "node:assert/strict";
import test from "node:test";
import { findDemoRecordForOwner, type DemoIssuerRecord } from "../lib/issuer/demo-record-lookup";

const aarav: DemoIssuerRecord = {
  id: "demo-record-active-01",
  issuer_id: "demo-school-board",
  certificate_reference: "demo-cert-active-2025-01",
  student_name: "Aarav Sample",
  seat_number: "DEMO-25001",
  exam_year: 2025,
  education_level: "secondary",
  signature_scenario: "valid",
  issuer_name: "Example School Board (Simulated)",
  trusted_key_id: "demo-school-key-v1",
  issuer_active: true,
};

function accountScopedDatabase(records: Map<string, DemoIssuerRecord>) {
  return {
    async query(sql: string, values: unknown[]) {
      assert.match(sql, /JOIN issuer_test_record_owners access/);
      assert.match(sql, /access\.owner_user_id = \$1/);
      const [ownerUserId] = values as [string];
      const row = records.get(ownerUserId);
      return { rows: row ? [row] : [] };
    },
  };
}

const aaravLookup = {
  studentName: "Aarav Sample",
  seatNumber: "DEMO-25001",
  examYear: 2025,
  educationLevel: "secondary" as const,
};

test("the fixture's assigned account can find its demo record", async () => {
  const database = accountScopedDatabase(new Map([["user-a", aarav]]));
  const result = await findDemoRecordForOwner(database, "user-a", "demo-school-board", aaravLookup);
  assert.equal(result?.id, aarav.id);
});

test("account B cannot retrieve account A's fixture", async () => {
  const database = accountScopedDatabase(new Map([["user-a", aarav]]));
  const result = await findDemoRecordForOwner(database, "user-b", "demo-school-board", aaravLookup);
  assert.equal(result, null);
});

test("account A cannot retrieve account B's fixture", async () => {
  const isha: DemoIssuerRecord = { ...aarav, id: "demo-record-active-02", student_name: "Isha Example", seat_number: "DEMO-24002" };
  const database = accountScopedDatabase(new Map([["user-b", isha]]));
  const result = await findDemoRecordForOwner(database, "user-a", "demo-school-board", {
    studentName: "Isha Example",
    seatNumber: "DEMO-24002",
    examYear: 2024,
    educationLevel: "higher_secondary",
  });
  assert.equal(result, null);
});

test("the issuer lookup never accepts an owner ID from lookup fields", async () => {
  let passedValues: unknown[] = [];
  const database = {
    async query(_sql: string, values: unknown[]) {
      passedValues = values;
      return { rows: [] };
    },
  };
  await findDemoRecordForOwner(database, "session-user-id", "demo-school-board", aaravLookup);
  assert.equal(passedValues[0], "session-user-id");
  assert.equal(passedValues.length, 6);
});
