import type { CertificateLookup } from "./types";

export interface DemoIssuerRecord {
  id: string;
  issuer_id: string;
  certificate_reference: string;
  student_name: string;
  seat_number: string;
  exam_year: number;
  education_level: CertificateLookup["educationLevel"];
  signature_scenario: "valid" | "invalid";
  issuer_name: string;
  trusted_key_id: string;
  issuer_active: boolean;
}

export interface DemoIssuerLookupDatabase {
  query(
    sql: string,
    values: unknown[],
  ): Promise<{ rows: DemoIssuerRecord[] }>;
}

const findOwnedDemoRecordSql = `
  SELECT r.id, r.issuer_id, r.certificate_reference, r.student_name, r.seat_number,
         r.exam_year, r.education_level, r.signature_scenario,
         i.display_name AS issuer_name, i.trusted_key_id, i.active AS issuer_active
  FROM issuer_test_records r
  JOIN issuer_test_record_owners access
    ON access.issuer_record_id = r.id
   AND access.owner_user_id = $1
  JOIN app_issuers i ON i.id = r.issuer_id
  WHERE r.issuer_id = $2
    AND lower(btrim(r.student_name)) = lower($3)
    AND upper(r.seat_number) = $4
    AND r.exam_year = $5
    AND r.education_level = $6
  LIMIT 1`;

/** Return only a demo fixture explicitly assigned to the authenticated account. */
export async function findDemoRecordForOwner(
  database: DemoIssuerLookupDatabase,
  ownerUserId: string,
  issuerId: string,
  lookup: CertificateLookup,
): Promise<DemoIssuerRecord | null> {
  const result = await database.query(findOwnedDemoRecordSql, [
    ownerUserId,
    issuerId,
    lookup.studentName,
    lookup.seatNumber,
    lookup.examYear,
    lookup.educationLevel,
  ]);
  return result.rows[0] ?? null;
}
