import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { CertificateLookup } from "./types";

interface CertificatePdfData extends CertificateLookup {
  issuerName: string;
  certificateReference: string;
  issuedAt: string;
}

export async function createSyntheticCertificatePdf(data: CertificatePdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create({ updateMetadata: false });
  const issuedAt = new Date(data.issuedAt);
  pdf.setTitle("School Certificate - Synthetic Demo");
  pdf.setAuthor(data.issuerName);
  pdf.setSubject("Synthetic test certificate for an interview demonstration");
  pdf.setCreator("Independent Certificate Wallet Demo");
  pdf.setProducer("pdf-lib");
  pdf.setCreationDate(issuedAt);
  pdf.setModificationDate(issuedAt);
  pdf.setLanguage("en-us");

  const page = pdf.addPage([612, 792]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.16, 0.13, 0.23);
  const purple = rgb(0.39, 0.26, 0.68);
  const muted = rgb(0.43, 0.41, 0.49);
  const pale = rgb(0.91, 0.88, 0.96);

  page.drawRectangle({ x: 32, y: 32, width: 548, height: 728, borderColor: pale, borderWidth: 2 });
  page.drawRectangle({ x: 42, y: 42, width: 528, height: 708, borderColor: pale, borderWidth: 0.7 });
  page.drawText("SYNTHETIC TEST CERTIFICATE", { x: 88, y: 690, size: 22, font: bold, color: purple });
  page.drawText(data.issuerName, { x: 88, y: 661, size: 13, font: bold, color: ink });
  page.drawText("Independent demonstration issuer - not a government document", { x: 88, y: 641, size: 9, font: regular, color: muted });
  page.drawLine({ start: { x: 88, y: 620 }, end: { x: 524, y: 620 }, thickness: 1, color: pale });

  page.drawText("This is to demonstrate a previously issued school record for", { x: 88, y: 575, size: 12, font: regular, color: ink });
  page.drawText(data.studentName, { x: 88, y: 535, size: 24, font: bold, color: ink });
  page.drawText("Education level", { x: 88, y: 480, size: 9, font: regular, color: muted });
  page.drawText(data.educationLevel === "secondary" ? "Secondary" : "Higher Secondary", { x: 88, y: 460, size: 14, font: bold, color: ink });
  page.drawText("Examination year", { x: 322, y: 480, size: 9, font: regular, color: muted });
  page.drawText(String(data.examYear), { x: 322, y: 460, size: 14, font: bold, color: ink });
  page.drawText("Synthetic seat number", { x: 88, y: 420, size: 9, font: regular, color: muted });
  page.drawText(data.seatNumber, { x: 88, y: 400, size: 12, font: bold, color: ink });
  page.drawText("Demo certificate reference", { x: 322, y: 420, size: 9, font: regular, color: muted });
  page.drawText(data.certificateReference, { x: 322, y: 400, size: 10, font: bold, color: ink });

  page.drawRectangle({ x: 88, y: 268, width: 436, height: 72, color: rgb(0.96, 0.94, 0.98), borderColor: pale, borderWidth: 1 });
  page.drawText("DEMO ONLY", { x: 108, y: 312, size: 15, font: bold, color: purple });
  page.drawText("Synthetic data. Not government-issued or legally authoritative.", { x: 108, y: 288, size: 10, font: regular, color: ink });
  page.drawText(`Fixture issue date: ${data.issuedAt.slice(0, 10)}`, { x: 88, y: 205, size: 10, font: regular, color: muted });
  page.drawLine({ start: { x: 88, y: 125 }, end: { x: 245, y: 125 }, thickness: 0.8, color: muted });
  page.drawText("Signature evidence is stored in a separate manifest", { x: 88, y: 108, size: 9, font: regular, color: muted });
  page.drawText("Verification uses a separate signed manifest and live demo status check.", { x: 88, y: 73, size: 8, font: regular, color: muted });

  return pdf.save({ useObjectStreams: false });
}


