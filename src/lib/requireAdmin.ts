import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Helper: Check if the current request is from an authenticated admin.
 * Returns a 401 JSON response if not authenticated, or null if authenticated.
 * 
 * Usage in API routes:
 *   const authError = requireAdmin();
 *   if (authError) return authError;
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized — admin login required" },
      { status: 401 }
    );
  }
  return null;
}
