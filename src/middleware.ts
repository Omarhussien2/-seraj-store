import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Middleware: Protects /admin/* routes.
 * Allows access to /admin/login without authentication.
 * Redirects unauthenticated users to /admin/login.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow the login page itself
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Protect all other /admin/* routes
  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
