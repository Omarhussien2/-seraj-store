import { NextResponse } from "next/server";
import { z } from "zod";
import { revokeConsentTokens } from "@/lib/analyticsConsent";
import { connectDB } from "@/lib/db";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WithdrawalSchema = z
  .object({
    tokens: z
      .array(z.string().regex(/^[A-Za-z0-9_-]{43}$/))
      .min(1)
      .max(20),
  })
  .strict();

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const ip = getClientIp(request);
  if (isRateLimited(`analytics-consent:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      { status: 429 }
    );
  }

  try {
    const withdrawal = WithdrawalSchema.parse(await request.json());
    await connectDB();
    await revokeConsentTokens(withdrawal.tokens);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 }
      );
    }
    console.error("POST /api/analytics/consent failed");
    return NextResponse.json(
      { success: false, error: "Withdrawal unavailable" },
      { status: 500 }
    );
  }
}
