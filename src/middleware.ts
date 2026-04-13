import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware: Protects /admin/* routes.
 *
 * Uses a lightweight session-cookie check instead of NextAuth's auth() wrapper,
 * which is incompatible with Next.js 16 on Vercel's edge runtime and was causing
 * API routes to return HTML instead of JSON.
 *
 * Full authentication is still enforced server-side via requireAdmin() in admin
 * API routes and via auth() in admin server components.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never intercept API routes — let them pass through directly
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Allow the login page itself
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Protect all other /admin/* routes — check for session cookie
  if (pathname.startsWith("/admin")) {
    const hasSession =
      request.cookies.has("authjs.session-token") ||
      request.cookies.has("__Secure-authjs.session-token");

    if (!hasSession) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
