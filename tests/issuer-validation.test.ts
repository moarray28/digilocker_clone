import assert from "node:assert/strict";
import test from "node:test";
import { InvalidCertificateLookupError } from "../lib/issuer/types";
import { validateCertificateLookup } from "../lib/issuer/validate-lookup";

test("normalizes whitespace and seat number casing for a valid synthetic lookup", () => {
  assert.deepEqual(validateCertificateLookup({
    studentName: "  Synthetic   Sample ",
    seatNumber: "demo-25001",
    examYear: 2025,
    educationLevel: "secondary",
  }), {
    studentName: "Synthetic Sample",
    seatNumber: "DEMO-25001",
    examYear: 2025,
    educationLevel: "secondary",
  });
});

test("rejects missing, malformed, and unsupported lookup values", () => {
  const invalidLookups: unknown[] = [
    null,
    [],
    { studentName: "A", seatNumber: "DEMO-1", examYear: 2025, educationLevel: "secondary" },
    { studentName: "Synthetic Sample", seatNumber: "bad seat", examYear: 2025, educationLevel: "secondary" },
    { studentName: "Synthetic Sample", seatNumber: "DEMO-25001", examYear: 1999, educationLevel: "secondary" },
    { studentName: "Synthetic Sample", seatNumber: "DEMO-25001", examYear: 2025, educationLevel: "primary" },
  ];

  for (const input of invalidLookups) {
    assert.throws(() => validateCertificateLookup(input), InvalidCertificateLookupError);
  }
});
