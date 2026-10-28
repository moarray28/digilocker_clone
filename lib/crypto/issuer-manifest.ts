import "server-only";
import { createPublicKey } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { IssuerCertificateArtifact } from "@/lib/issuer/types";
import { verifyIssuerArtifactWithPublicKey, type TrustedIssuerKey } from "./manifest-core";

export { calculateSha256, canonicalizeIssuerManifest } from "./manifest-core";
export type { ArtifactVerification } from "./manifest-core";

export interface TrustedIssuerKeyFile extends TrustedIssuerKey {
  publicKeyPath?: string;
}

export async function verifyIssuerArtifact(
  artifact: IssuerCertificateArtifact,
  trustedKey: TrustedIssuerKeyFile,
) {
  if (artifact.manifest.schemaVersion !== 1 || artifact.manifest.issuerId !== trustedKey.issuerId || artifact.manifest.keyId !== trustedKey.keyId) {
    return verifyIssuerArtifactWithPublicKey(artifact, trustedKey);
  }

  let publicKey;
  try {
    const pem = process.env.ISSUER_TRUSTED_PUBLIC_KEY?.trim();
    if (pem) {
      publicKey = createPublicKey(pem);
    } else if (trustedKey.publicKeyPath) {
      const path = resolve(process.cwd(), trustedKey.publicKeyPath);
      publicKey = createPublicKey(await readFile(path));
    } else {
      throw new Error("No trusted key configured.");
    }
  } catch {
    throw new Error("The trusted simulated issuer public key could not be loaded.");
  }

  return verifyIssuerArtifactWithPublicKey(artifact, trustedKey, publicKey);
}
