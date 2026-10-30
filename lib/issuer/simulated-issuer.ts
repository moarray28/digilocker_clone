import "server-only";
import { createHash, sign } from "node:crypto";
import { database } from "@/lib/database";
import { createSyntheticCertificatePdf } from "./certificate-pdf";
import { canonicalizeIssuerManifest } from "@/lib/crypto/issuer-manifest";
import { findDemoRecordForOwner } from "@/lib/issuer/demo-record-lookup";
import { DEMO_ISSUER_ID, DEMO_ISSUER_KEY_ID, DEMO_ISSUER_PRIVATE_KEY } from "@/lib/issuer/demo-issuer-key";
import { validateCertificateLookup } from "./validate-lookup";
import {
  IssuerConfigurationError,
  IssuerUnavailableError,
  type CertificateLookup,
  type CertificateStatus,
  type IssuerCertificateArtifact,
  type IssuerFailureMode,
} from "./types";

export interface IssuerAdapter {
  findCertificate(ownerUserId: string, input: unknown): Promise<IssuerCertificateArtifact | null>;
  getCurrentStatus(issuerId: string, certificateReference: string): Promise<CertificateStatus>;
}

function getFailureMode(): IssuerFailureMode {
  const mode = process.env.ISSUER_SIMULATED_FAILURE_MODE ?? "none";
  if (mode === "none" || mode === "unavailable" || mode === "status_unavailable") return mode;
  throw new IssuerConfigurationError("ISSUER_SIMULATED_FAILURE_MODE must be none, unavailable, or status_unavailable.");
}

function normalizeLookup(input: unknown): CertificateLookup {
  return validateCertificateLookup(input);
}

export const simulatedIssuerAdapter: IssuerAdapter = {
  async findCertificate(ownerUserId, input) {
    const failureMode = getFailureMode();
    if (failureMode === "unavailable") throw new IssuerUnavailableError();

    const lookup = normalizeLookup(input);
    let record;
    try {
      record = await findDemoRecordForOwner(database, ownerUserId, DEMO_ISSUER_ID, lookup);
    } catch {
      throw new IssuerUnavailableError();
    }

    if (!record) return null;
    if (!record.issuer_active) throw new IssuerUnavailableError();

    if (record.trusted_key_id !== DEMO_ISSUER_KEY_ID) {
      throw new IssuerConfigurationError("The configured test key identifier does not match the issuer registry.");
    }

    const certificate: CertificateLookup = {
      studentName: record.student_name,
      seatNumber: record.seat_number,
      examYear: record.exam_year,
      educationLevel: record.education_level,
    };
    const issuedAt = `${record.exam_year}-06-30T00:00:00.000Z`;
    const pdfBytes = await createSyntheticCertificatePdf({
      ...certificate,
      issuerName: record.issuer_name,
      certificateReference: record.certificate_reference,
      issuedAt,
    });
    const manifest = {
      schemaVersion: 1 as const,
      issuerId: record.issuer_id as string,
      issuerName: record.issuer_name as string,
      certificateReference: record.certificate_reference as string,
      studentName: record.student_name as string,
      seatNumber: record.seat_number as string,
      examYear: Number(record.exam_year),
      educationLevel: record.education_level as CertificateLookup["educationLevel"],
      issuedAt,
      keyId: DEMO_ISSUER_KEY_ID,
      pdfSha256: createHash("sha256").update(pdfBytes).digest("hex"),
    };
    const signature = sign(null, Buffer.from(canonicalizeIssuerManifest(manifest)), DEMO_ISSUER_PRIVATE_KEY);
    if (record.signature_scenario === "invalid") signature[0] ^= 0x01;

    return { pdfBytes, manifest, signatureBase64: signature.toString("base64") };
  },

  async getCurrentStatus(issuerId, certificateReference) {
    const failureMode = getFailureMode();
    if (failureMode === "unavailable" || failureMode === "status_unavailable") {
      throw new IssuerUnavailableError();
    }
    if (issuerId !== DEMO_ISSUER_ID || !certificateReference) {
      throw new IssuerUnavailableError();
    }

    try {
      const result = await database.query(
        `SELECT r.certificate_status, i.active AS issuer_active
         FROM issuer_test_records r
         JOIN app_issuers i ON i.id = r.issuer_id
         WHERE r.issuer_id = $1 AND r.certificate_reference = $2
         LIMIT 1`,
        [issuerId, certificateReference],
      );
      const record = result.rows[0];
      if (!record || !record.issuer_active) throw new IssuerUnavailableError();
      return record.certificate_status as CertificateStatus;
    } catch (error) {
      if (error instanceof IssuerUnavailableError) throw error;
      throw new IssuerUnavailableError();
    }
  },
};
