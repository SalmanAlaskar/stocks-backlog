import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/wallet",
  "/market",
  "/watchlists",
  "/trade",
  "/orders",
  "/portfolio",
  "/settings",
  "/notifications",
  "/assistant",
  "/ipo",
  "/statements",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const sessionId = request.cookies.get("session_id")?.value;
  if (!sessionId) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/wallet/:path*",
    "/market/:path*",
    "/watchlists/:path*",
    "/trade/:path*",
    "/orders/:path*",
    "/portfolio/:path*",
    "/settings/:path*",
    "/notifications/:path*",
    "/assistant/:path*",
    "/ipo/:path*",
    "/statements/:path*",
  ],
};
