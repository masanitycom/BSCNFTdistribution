import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const session = request.cookies.get("session");

  // Protected routes
  const protectedPaths = ["/dashboard", "/collections", "/settings"];
  const isProtectedPath = protectedPaths.some((p) => path.startsWith(p));

  // If it's a protected path and no session, redirect to login
  if (isProtectedPath && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If logged in and trying to access login, redirect to dashboard
  if (path === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - gallery (public route)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|gallery).*)",
  ],
};