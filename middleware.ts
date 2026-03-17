import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding/create-school"];

function hasSession(request: NextRequest) {
  return Boolean(request.cookies.get("skuully_access_token")?.value);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loggedIn = hasSession(request);

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  const isProtectedPath = PROTECTED_PREFIXES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!loggedIn && isProtectedPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/dashboard/:path*",
    "/onboarding/:path*",
  ],
};