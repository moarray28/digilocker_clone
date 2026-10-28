import { educationLevels, InvalidCertificateLookupError, type CertificateLookup } from "./types";

export function validateCertificateLookup(input: unknown): CertificateLookup {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new InvalidCertificateLookupError();
  }

  const value = input as Record<string, unknown>;
  if (typeof value.studentName !== "string" || typeof value.seatNumber !== "string") {
    throw new InvalidCertificateLookupError();
  }

  const studentName = value.studentName.trim().replace(/\s+/g, " ");
  const seatNumber = value.seatNumber.trim().toUpperCase();
  if (!/^[\p{L}\p{M} .'-]{2,100}$/u.test(studentName)) {
    throw new InvalidCertificateLookupError();
  }
  if (!/^[A-Z0-9-]{4,24}$/.test(seatNumber)) {
    throw new InvalidCertificateLookupError();
  }
  if (!Number.isInteger(value.examYear) || Number(value.examYear) < 2000 || Number(value.examYear) > 2100) {
    throw new InvalidCertificateLookupError();
  }
  if (!educationLevels.includes(value.educationLevel as (typeof educationLevels)[number])) {
    throw new InvalidCertificateLookupError();
  }

  return {
    studentName,
    seatNumber,
    examYear: Number(value.examYear),
    educationLevel: value.educationLevel as CertificateLookup["educationLevel"],
  };
}
