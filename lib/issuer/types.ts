export const educationLevels = ["secondary", "higher_secondary"] as const;
export type EducationLevel = (typeof educationLevels)[number];
export type CertificateStatus = "active" | "revoked" | "superseded";
export type IssuerFailureMode = "none" | "unavailable" | "status_unavailable";

export interface CertificateLookup {
  studentName: string;
  seatNumber: string;
  examYear: number;
  educationLevel: EducationLevel;
}

export interface IssuerCertificateManifest {
  schemaVersion: 1;
  issuerId: string;
  issuerName: string;
  certificateReference: string;
  studentName: string;
  seatNumber: string;
  examYear: number;
  educationLevel: EducationLevel;
  issuedAt: string;
  keyId: string;
  pdfSha256: string;
}

export interface IssuerCertificateArtifact {
  pdfBytes: Uint8Array;
  manifest: IssuerCertificateManifest;
  signatureBase64: string;
}

export class IssuerUnavailableError extends Error {
  readonly code = "ISSUER_UNAVAILABLE";
  constructor() {
    super("Unable to contact the simulated issuer.");
    this.name = "IssuerUnavailableError";
  }
}

export class IssuerConfigurationError extends Error {
  readonly code = "ISSUER_CONFIGURATION_ERROR";
  constructor(message: string) {
    super(message);
    this.name = "IssuerConfigurationError";
  }
}

export class InvalidCertificateLookupError extends Error {
  readonly code = "INVALID_LOOKUP";
  constructor() {
    super("The certificate lookup details are invalid.");
    this.name = "InvalidCertificateLookupError";
  }
}
