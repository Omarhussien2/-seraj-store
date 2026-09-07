import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { deliverPendingPurchases } from "@/lib/analyticsPurchase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const clientIp = getClientIp(request);
  if (isRateLimited(`analytics-retry:${clientIp}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { success: false, error: "Too many analytics retry requests" },
      { status: 429 }
    );
  }

  await connectDB();
  const delivery = await deliverPendingPurchases({ limit: 3 });
  return NextResponse.json({ success: true, data: delivery });
}
