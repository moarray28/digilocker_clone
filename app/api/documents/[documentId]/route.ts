import { auth } from "@/auth";
import { calculateSha256 } from "@/lib/crypto/issuer-manifest";
import { database } from "@/lib/database";
import { simulatedIssuerAdapter } from "@/lib/issuer/simulated-issuer";
import { downloadPrivatePdf } from "@/lib/storage/private-bucket";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ documentId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Sign in to view this document." }, { status: 401 });
  const { documentId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(documentId)) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  try {
    const result = await database.query(
      `SELECT d.id, d.issuer_id, d.issuer_certificate_reference, d.storage_object_key, d.sha256_hex,
              d.integrity_verified, d.signature_verified
       FROM wallet_documents d JOIN certificate_requests r ON r.id = d.request_id
       WHERE d.id = $1 AND d.owner_user_id = $2 AND r.owner_user_id = $2 AND r.state = 'completed' LIMIT 1`,
      [documentId, session.user.id],
    );
    const document = result.rows[0];
    if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });

    const status = await simulatedIssuerAdapter.getCurrentStatus(document.issuer_id, document.issuer_certificate_reference);
    await database.query(`UPDATE wallet_documents SET current_status = $2, status_checked_at = now() WHERE id = $1 AND owner_user_id = $3`, [documentId, status, session.user.id]);
    if (status !== "active") return NextResponse.json({ error: status === "revoked" ? "The issuer reports this certificate as revoked." : "The issuer reports that a newer certificate replaced this one." }, { status: 410 });

    const bytes = await downloadPrivatePdf(document.storage_object_key);
    if (calculateSha256(bytes) !== document.sha256_hex || !document.integrity_verified) {
      return NextResponse.json({ error: "The stored file did not pass its integrity check." }, { status: 422 });
    }
    if (!document.signature_verified) return NextResponse.json({ error: "The issuer signature could not be verified." }, { status: 422 });

    const disposition = new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline";
    return new Response(Buffer.from(bytes), { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="certificate-${documentId}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    return NextResponse.json({ error: "Unable to confirm certificate status or retrieve the document. Try again later." }, { status: 503 });
  }
}
