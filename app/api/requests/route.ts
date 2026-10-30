import { auth } from "@/auth";
import { calculateSha256, verifyIssuerArtifact } from "@/lib/crypto/issuer-manifest";
import { database } from "@/lib/database";
import {
  InvalidCertificateLookupError,
  IssuerConfigurationError,
  IssuerUnavailableError,
  type CertificateLookup,
} from "@/lib/issuer/types";
import { simulatedIssuerAdapter } from "@/lib/issuer/simulated-issuer";
import { DEMO_ISSUER_ID, DEMO_ISSUER_KEY_ID } from "@/lib/issuer/demo-issuer-key";
import { validateCertificateLookup } from "@/lib/issuer/validate-lookup";
import { removePrivatePdf, uploadPrivatePdf } from "@/lib/storage/private-bucket";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return fail("Sign in to request a document.", 401);

  const idempotencyKey = request.headers.get("idempotency-key");
  if (!idempotencyKey || !/^[0-9a-f-]{36}$/i.test(idempotencyKey)) return fail("Refresh and try again.", 400);

  let lookup: CertificateLookup;
  try {
    lookup = validateCertificateLookup(await request.json());
  } catch (error) {
    if (error instanceof InvalidCertificateLookupError) {
      return fail("Enter valid synthetic sample details.", 400);
    }
    return fail("Enter valid sample details.", 400);
  }

  const requestId = randomUUID();
  try {
    const inserted = await database.query(
      `INSERT INTO certificate_requests (id, owner_user_id, issuer_id, state, idempotency_key)
       VALUES ($1, $2, 'demo-school-board', 'created', $3)
       ON CONFLICT (owner_user_id, idempotency_key) DO NOTHING RETURNING id`,
      [requestId, user.id, idempotencyKey],
    );
    if (!inserted.rowCount) {
      const existing = await database.query(
        `SELECT id, state, safe_error_code FROM certificate_requests WHERE owner_user_id = $1 AND idempotency_key = $2`,
        [user.id, idempotencyKey],
      );
      if (existing.rows[0]?.state === "completed") {
        const document = await database.query(`SELECT id FROM wallet_documents WHERE request_id = $1 AND owner_user_id = $2`, [existing.rows[0].id, user.id]);
        if (document.rows[0]) return NextResponse.json({ documentId: document.rows[0].id, state: "completed" });
      }
      const previous = existing.rows[0];
      if (previous?.state && ["no_match", "issuer_unavailable", "integrity_failed", "signature_invalid", "status_check_failed", "certificate_revoked", "certificate_superseded", "storage_failed", "internal_error"].includes(previous.state)) {
        const outcomes: Record<string, { message: string; status: number }> = {
          no_match: { message: "No sample record matched. Check the fictional fixture details and try again.", status: 404 },
          issuer_unavailable: { message: "Unable to confirm certificate status. Try again later.", status: 503 },
          integrity_failed: { message: "The certificate file did not pass its integrity check.", status: 422 },
          signature_invalid: { message: "The issuer signature could not be verified.", status: 422 },
          status_check_failed: { message: "Unable to confirm certificate status. Try again later.", status: 503 },
          certificate_revoked: { message: "The issuer reports this certificate as revoked.", status: 422 },
          certificate_superseded: { message: "The issuer reports that a newer certificate replaced this one.", status: 422 },
          storage_failed: { message: "The document could not be saved. Try again later.", status: 503 },
          internal_error: { message: "The request could not be completed. Try again later.", status: 500 },
        };
        const outcome = outcomes[previous.state];
        if (outcome) return fail(outcome.message, outcome.status);
      }
      return fail("This request is already being processed. Please refresh your wallet.", 409);
    }
  } catch {
    return fail("Wallet database is unavailable. Try again later.", 503);
  }

  let state = "created";
  let uploadedKey: string | null = null;
  const setState = async (next: string, errorCode: string | null = null) => {
    state = next;
    await database.query(`UPDATE certificate_requests SET state = $2, safe_error_code = $3, updated_at = now() WHERE id = $1 AND owner_user_id = $4`, [requestId, next, errorCode, user.id]);
  };
  const failRequest = async (next: string, code: string, message: string, status: number) => {
    await setState(next, code);
    try {
      await database.query(
        `INSERT INTO audit_events (id, actor_user_id, action, target_type, target_id, outcome, safe_metadata)
         VALUES ($1, $2, 'certificate_request', 'certificate_request', $3, 'failure', $4::jsonb)`,
        [randomUUID(), user.id, requestId, JSON.stringify({ error_code: code, state: next })],
      );
    } catch { /* Failure auditing is best effort and contains no raw lookup fields. */ }
    return fail(message, status);
  };

  try {
    await setState("authenticating_request");
    await setState("querying_issuer");
    const artifact = await simulatedIssuerAdapter.findCertificate(user.id, lookup);
    if (!artifact) return await failRequest("no_match", "NO_MATCH", "No sample record matched. Check the fictional fixture details and try again.", 404);

    await setState("certificate_received");
    await setState("verifying_signature");
    const verification = await verifyIssuerArtifact(artifact, {
      issuerId: DEMO_ISSUER_ID,
      keyId: DEMO_ISSUER_KEY_ID,
    });
    if (!verification.integrityVerified) return await failRequest("integrity_failed", "INTEGRITY_FAILED", "The certificate file did not pass its integrity check.", 422);
    if (!verification.signatureVerified) return await failRequest("signature_invalid", "SIGNATURE_INVALID", "The issuer signature could not be verified.", 422);

    await setState("checking_current_status");
    const status = await simulatedIssuerAdapter.getCurrentStatus(artifact.manifest.issuerId, artifact.manifest.certificateReference);
    if (status === "revoked") return await failRequest("certificate_revoked", "CERTIFICATE_REVOKED", "The issuer reports this certificate as revoked.", 422);
    if (status === "superseded") return await failRequest("certificate_superseded", "CERTIFICATE_SUPERSEDED", "The issuer reports that a newer certificate replaced this one.", 422);

    await setState("storing_document");
    const documentId = randomUUID();
    uploadedKey = `${user.id}/${documentId}.pdf`;
    await uploadPrivatePdf(uploadedKey, artifact.pdfBytes);
    const client = await database.connect();
    try {
      await client.query("BEGIN");
      await client.query(
      `INSERT INTO wallet_documents (id, request_id, owner_user_id, issuer_id, issuer_certificate_reference,
       storage_object_key, sha256_hex, integrity_verified, signature_verified, signature_key_id, current_status, status_checked_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, true, $8, 'active', now())`,
      [documentId, requestId, user.id, artifact.manifest.issuerId, artifact.manifest.certificateReference,
        uploadedKey, calculateSha256(artifact.pdfBytes), verification.signatureVerified ? artifact.manifest.keyId : ""],
      );
      await client.query(`UPDATE certificate_requests SET state = 'completed', updated_at = now(), completed_at = now() WHERE id = $1 AND owner_user_id = $2`, [requestId, user.id]);
      await client.query(
      `INSERT INTO audit_events (id, actor_user_id, action, target_type, target_id, outcome, safe_metadata)
       VALUES ($1, $2, 'certificate_retrieved', 'wallet_document', $3, 'success', $4::jsonb)`,
      [randomUUID(), user.id, documentId, JSON.stringify({ issuer_id: artifact.manifest.issuerId, integrity_verified: true, signature_verified: true, current_status: "active" })],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    return NextResponse.json({ documentId, state: "completed" }, { status: 201 });
  } catch (error) {
    if (uploadedKey) {
      try {
        const stored = await database.query("SELECT 1 FROM wallet_documents WHERE storage_object_key = $1", [uploadedKey]);
        if (!stored.rowCount) await removePrivatePdf(uploadedKey);
      } catch { /* Preserve the stored file if database state is uncertain. */ }
    }
    if (error instanceof IssuerUnavailableError) return await failRequest(state === "checking_current_status" ? "status_check_failed" : "issuer_unavailable", state === "checking_current_status" ? "STATUS_CHECK_FAILED" : "ISSUER_UNAVAILABLE", "Unable to confirm certificate status. Try again later.", 503);
    if (error instanceof IssuerConfigurationError) return await failRequest("internal_error", "ISSUER_CONFIGURATION_ERROR", "The simulated issuer is not configured. Please try again later.", 503);
    if (state === "storing_document") return await failRequest("storage_failed", "STORAGE_FAILED", "The document could not be saved. Try again later.", 503);
    return await failRequest("internal_error", "INTERNAL_ERROR", "The request could not be completed. Try again later.", 500);
  }
}
