import { createHash, verify, type KeyObject } from "node:crypto";
import type { IssuerCertificateArtifact, IssuerCertificateManifest } from "../issuer/types";

export interface ArtifactVerification {
  integrityVerified: boolean;
  signatureVerified: boolean;
  signatureFailure: "issuer_mismatch" | "key_id_mismatch" | "signature_invalid" | null;
}

export interface TrustedIssuerKey {
  issuerId: string;
  keyId: string;
}

export function calculateSha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function canonicalizeIssuerManifest(manifest: IssuerCertificateManifest): string {
  return JSON.stringify({
    schemaVersion: manifest.schemaVersion,
    issuerId: manifest.issuerId,
    issuerName: manifest.issuerName,
    certificateReference: manifest.certificateReference,
    studentName: manifest.studentName,
    seatNumber: manifest.seatNumber,
    examYear: manifest.examYear,
    educationLevel: manifest.educationLevel,
    issuedAt: manifest.issuedAt,
    keyId: manifest.keyId,
    pdfSha256: manifest.pdfSha256,
  });
}

export function verifyIssuerArtifactWithPublicKey(
  artifact: IssuerCertificateArtifact,
  trustedKey: TrustedIssuerKey,
  publicKey?: KeyObject,
): ArtifactVerification {
  const integrityVerified = calculateSha256(artifact.pdfBytes) === artifact.manifest.pdfSha256;
  let signatureFailure: ArtifactVerification["signatureFailure"] = null;

  if (artifact.manifest.schemaVersion !== 1 || artifact.manifest.issuerId !== trustedKey.issuerId) {
    signatureFailure = "issuer_mismatch";
  } else if (artifact.manifest.keyId !== trustedKey.keyId) {
    signatureFailure = "key_id_mismatch";
  } else {
    if (!publicKey) throw new Error("A trusted issuer public key is required.");
    if (publicKey.asymmetricKeyType !== "ed25519") throw new Error("The trusted simulated issuer key must be Ed25519.");
    try {
      const signature = Buffer.from(artifact.signatureBase64, "base64");
      const valid = verify(
        null,
        Buffer.from(canonicalizeIssuerManifest(artifact.manifest)),
        publicKey,
        signature,
      );
      if (!valid) signatureFailure = "signature_invalid";
    } catch {
      signatureFailure = "signature_invalid";
    }
  }

  return {
    integrityVerified,
    signatureVerified: signatureFailure === null,
    signatureFailure,
  };
}
