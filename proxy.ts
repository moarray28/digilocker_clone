import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const hasSessionCookie = Boolean(getSessionCookie(request));
  const protectedPath = request.nextUrl.pathname.startsWith("/wallet");

  if (protectedPath && !hasSessionCookie) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }
  if ((request.nextUrl.pathname === "/signin" || request.nextUrl.pathname === "/signup") && hasSessionCookie) {
    return NextResponse.redirect(new URL("/wallet", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/wallet/:path*", "/signin", "/signup"] };

