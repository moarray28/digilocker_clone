import assert from "node:assert/strict";
import { generateKeyPairSync, sign, type KeyObject } from "node:crypto";
import test from "node:test";
import type { IssuerCertificateArtifact, IssuerCertificateManifest } from "../lib/issuer/types";
import { calculateSha256, canonicalizeIssuerManifest, verifyIssuerArtifactWithPublicKey } from "../lib/crypto/manifest-core";

function signedFixture() {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const pdfBytes = Buffer.from("synthetic certificate pdf bytes");
  const manifest: IssuerCertificateManifest = {
    schemaVersion: 1,
    issuerId: "demo-school-board",
    issuerName: "Example School Board (Simulated)",
    certificateReference: "synthetic-reference-1",
    studentName: "Synthetic Sample",
    seatNumber: "DEMO-25001",
    examYear: 2025,
    educationLevel: "secondary",
    issuedAt: "2025-06-30T00:00:00.000Z",
    keyId: "demo-key-v1",
    pdfSha256: calculateSha256(pdfBytes),
  };
  const signatureBase64 = sign(null, Buffer.from(canonicalizeIssuerManifest(manifest)), privateKey).toString("base64");
  return {
    artifact: { pdfBytes, manifest, signatureBase64 } satisfies IssuerCertificateArtifact,
    publicKey: publicKey as KeyObject,
    trustedKey: { issuerId: manifest.issuerId, keyId: manifest.keyId },
  };
}

test("accepts an intact PDF and a manifest signed by the configured issuer key", () => {
  const fixture = signedFixture();
  assert.deepEqual(verifyIssuerArtifactWithPublicKey(fixture.artifact, fixture.trustedKey, fixture.publicKey), {
    integrityVerified: true,
    signatureVerified: true,
    signatureFailure: null,
  });
});

test("keeps file integrity and manifest signature outcomes separate", () => {
  const fixture = signedFixture();
  const modifiedPdf = Buffer.from(fixture.artifact.pdfBytes);
  modifiedPdf[0] ^= 0xff;
  const result = verifyIssuerArtifactWithPublicKey(
    { ...fixture.artifact, pdfBytes: modifiedPdf }, fixture.trustedKey, fixture.publicKey,
  );
  assert.equal(result.integrityVerified, false);
  assert.equal(result.signatureVerified, true);
});

test("rejects a modified manifest even when the PDF bytes remain intact", () => {
  const fixture = signedFixture();
  const changed = {
    ...fixture.artifact,
    manifest: { ...fixture.artifact.manifest, studentName: "Different Synthetic Name" },
  };
  const result = verifyIssuerArtifactWithPublicKey(changed, fixture.trustedKey, fixture.publicKey);
  assert.equal(result.integrityVerified, true);
  assert.equal(result.signatureVerified, false);
  assert.equal(result.signatureFailure, "signature_invalid");
});

test("rejects a different trusted issuer, key identifier, and signing key", () => {
  const fixture = signedFixture();
  const anotherPair = generateKeyPairSync("ed25519");
  assert.equal(verifyIssuerArtifactWithPublicKey(fixture.artifact, { ...fixture.trustedKey, issuerId: "untrusted-issuer" }).signatureFailure, "issuer_mismatch");
  assert.equal(verifyIssuerArtifactWithPublicKey(fixture.artifact, { ...fixture.trustedKey, keyId: "untrusted-key" }).signatureFailure, "key_id_mismatch");
  const wrongKey = verifyIssuerArtifactWithPublicKey(fixture.artifact, fixture.trustedKey, anotherPair.publicKey);
  assert.equal(wrongKey.signatureVerified, false);
  assert.equal(wrongKey.signatureFailure, "signature_invalid");
});

test("canonical manifest serialization is stable and excludes unknown properties", () => {
  const fixture = signedFixture();
  const extended = { ...fixture.artifact.manifest, ignoredProperty: "not signed" };
  assert.equal(canonicalizeIssuerManifest(extended), canonicalizeIssuerManifest(fixture.artifact.manifest));
});
