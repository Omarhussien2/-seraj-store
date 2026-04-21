import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://seraj-store.vercel.app";

/**
 * Middleware: Protects /admin/* routes + adds Link headers for agent discovery.
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

  // Add Link headers for agent/crawler discovery on homepage
  const response = NextResponse.next();
  if (pathname === "/") {
    response.headers.set(
      "Link",
      [
        `<${SITE_URL}/sitemap.xml>; rel="sitemap"; type="application/xml"`,
        `<${SITE_URL}/robots.txt>; rel="robots"`,
      ].join(", ")
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets|sw.js|manifest.json|.*\\.html$).*)"],
};
