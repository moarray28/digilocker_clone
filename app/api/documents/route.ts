import { auth } from "@/auth";
import { database } from "@/lib/database";
import { downloadPrivatePdf } from "@/lib/storage/private-bucket";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Sign in to view your wallet." }, { status: 401 });

  try {
    const result = await database.query(
      `SELECT d.id, i.display_name AS issuer_name, d.integrity_verified, d.signature_verified,
              d.current_status, d.status_checked_at, d.created_at
       FROM wallet_documents d JOIN app_issuers i ON i.id = d.issuer_id
       WHERE d.owner_user_id = $1 ORDER BY d.created_at DESC`, [session.user.id],
    );
    return NextResponse.json({ documents: result.rows });
  } catch {
    return NextResponse.json({ error: "Wallet is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST() {
  return NextResponse.json({ error: "Use the certificate request endpoint." }, { status: 405 });
}

