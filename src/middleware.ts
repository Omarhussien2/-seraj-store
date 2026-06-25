import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { env } from "@/env";

const SITE_URL = env.NEXT_PUBLIC_SITE_URL || "https://seraj-store.vercel.app";

/**
 * Middleware: Protects /admin/* routes + adds Link headers for agent discovery.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Never intercept API routes — let them pass through directly
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Allow the login page itself
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Protect all other /admin/* routes — check for valid session via auth()
  if (pathname.startsWith("/admin")) {
    const hasSession = !!req.auth;

    if (!hasSession) {
      const loginUrl = new URL("/admin/login", req.url);
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
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets|sw.js|manifest.json|.*\\.html$).*)"],
};
