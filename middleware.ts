import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/onboarding", "/dashboard", "/verify-email"];
const PUBLIC_AUTH_PAGES = ["/login", "/register", "/forgot-password", "/reset-password"];

function hasAccessToken(req: NextRequest) {
  return !!req.cookies.get("skuully_access_token")?.value;
}

function matches(pathname: string, paths: string[]) {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const authenticated = hasAccessToken(req);

  if (matches(pathname, PROTECTED_PATHS) && !authenticated) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (matches(pathname, PUBLIC_AUTH_PAGES) && authenticated) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/onboarding/:path*",
    "/dashboard/:path*",
    "/verify-email",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};