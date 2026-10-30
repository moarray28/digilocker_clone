import "server-only";
import type { IssuerCertificateArtifact } from "@/lib/issuer/types";
import { DEMO_ISSUER_ID, DEMO_ISSUER_KEY_ID, DEMO_ISSUER_PUBLIC_KEY } from "@/lib/issuer/demo-issuer-key";
import { verifyIssuerArtifactWithPublicKey, type TrustedIssuerKey } from "./manifest-core";

export { calculateSha256, canonicalizeIssuerManifest } from "./manifest-core";
export type { ArtifactVerification } from "./manifest-core";

export type TrustedIssuerKeyFile = TrustedIssuerKey;

export async function verifyIssuerArtifact(
  artifact: IssuerCertificateArtifact,
  trustedKey: TrustedIssuerKeyFile,
) {
  return verifyIssuerArtifactWithPublicKey(artifact, trustedKey, DEMO_ISSUER_PUBLIC_KEY);
}
