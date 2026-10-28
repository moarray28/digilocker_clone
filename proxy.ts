import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const hasSessionCookie = Boolean(getSessionCookie(request));
  const protectedPath = request.nextUrl.pathname.startsWith("/wallet");

  if (protectedPath && !hasSessionCookie) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(signInUrl);
  }
  if ((request.nextUrl.pathname === "/signin" || request.nextUrl.pathname === "/signup") && hasSessionCookie) {
    const target = request.nextUrl.searchParams.get("next");
    const redirectTo = target?.startsWith("/") && !target.startsWith("//") ? target : "/";
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/wallet/:path*", "/signin", "/signup"] };

