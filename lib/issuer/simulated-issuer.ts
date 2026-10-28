import "server-only";
import { createHash, createPrivateKey, sign } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { database } from "@/lib/database";
import { createSyntheticCertificatePdf } from "./certificate-pdf";
import { canonicalizeIssuerManifest } from "@/lib/crypto/issuer-manifest";
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
  findCertificate(input: unknown): Promise<IssuerCertificateArtifact | null>;
  getCurrentStatus(issuerId: string, certificateReference: string): Promise<CertificateStatus>;
}

const SIMULATED_ISSUER_ID = "demo-school-board";

function getFailureMode(): IssuerFailureMode {
  const mode = process.env.ISSUER_SIMULATED_FAILURE_MODE ?? "none";
  if (mode === "none" || mode === "unavailable" || mode === "status_unavailable") return mode;
  throw new IssuerConfigurationError("ISSUER_SIMULATED_FAILURE_MODE must be none, unavailable, or status_unavailable.");
}

function configuredKeyId(): string {
  const keyId = process.env.ISSUER_TEST_KEY_ID;
  if (!keyId || !/^[A-Za-z0-9._-]{3,80}$/.test(keyId)) {
    throw new IssuerConfigurationError("The simulated issuer test key identifier is not configured.");
  }
  return keyId;
}

async function configuredPrivateKey() {
  const pem = process.env.ISSUER_TEST_PRIVATE_KEY?.trim();
  if (pem) return createPrivateKey(pem);
  const filePath = process.env.ISSUER_TEST_PRIVATE_KEY_PATH;
  if (!filePath) throw new IssuerConfigurationError("ISSUER_TEST_PRIVATE_KEY_PATH is not configured.");
  return createPrivateKey(await readFile(resolve(process.cwd(), filePath)));
}

function normalizeLookup(input: unknown): CertificateLookup {
  return validateCertificateLookup(input);
}

export const simulatedIssuerAdapter: IssuerAdapter = {
  async findCertificate(input) {
    const failureMode = getFailureMode();
    if (failureMode === "unavailable") throw new IssuerUnavailableError();

    const lookup = normalizeLookup(input);
    let result;
    try {
      result = await database.query(
        `SELECT r.issuer_id, r.certificate_reference, r.student_name, r.seat_number,
                r.exam_year, r.education_level, r.signature_scenario,
                i.display_name AS issuer_name, i.trusted_key_id, i.active AS issuer_active
         FROM issuer_test_records r
         JOIN app_issuers i ON i.id = r.issuer_id
         WHERE r.issuer_id = $1
           AND lower(btrim(r.student_name)) = lower($2)
           AND upper(r.seat_number) = $3
           AND r.exam_year = $4
           AND r.education_level = $5
         LIMIT 1`,
        [SIMULATED_ISSUER_ID, lookup.studentName, lookup.seatNumber, lookup.examYear, lookup.educationLevel],
      );
    } catch {
      throw new IssuerUnavailableError();
    }

    const record = result.rows[0];
    if (!record) return null;
    if (!record.issuer_active) throw new IssuerUnavailableError();

    const keyId = configuredKeyId();
    if (record.trusted_key_id !== keyId) {
      throw new IssuerConfigurationError("The configured test key identifier does not match the issuer registry.");
    }

    let privateKey;
    try {
      privateKey = await configuredPrivateKey();
    } catch {
      throw new IssuerConfigurationError("The simulated issuer signing key could not be loaded.");
    }
    if (privateKey.asymmetricKeyType !== "ed25519") {
      throw new IssuerConfigurationError("The simulated issuer signing key must be Ed25519.");
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
      keyId,
      pdfSha256: createHash("sha256").update(pdfBytes).digest("hex"),
    };
    const signature = sign(null, Buffer.from(canonicalizeIssuerManifest(manifest)), privateKey);
    if (record.signature_scenario === "invalid") signature[0] ^= 0x01;

    return { pdfBytes, manifest, signatureBase64: signature.toString("base64") };
  },

  async getCurrentStatus(issuerId, certificateReference) {
    const failureMode = getFailureMode();
    if (failureMode === "unavailable" || failureMode === "status_unavailable") {
      throw new IssuerUnavailableError();
    }
    if (issuerId !== SIMULATED_ISSUER_ID || !certificateReference) {
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
