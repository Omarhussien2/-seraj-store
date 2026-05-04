import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/requireAdmin";
import {
  getOrCreatePaymentSettings,
  toPublic,
  updatePaymentSettings,
} from "@/lib/paymentSettings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PatchSchema = z.object({
  depositEnabled: z.boolean().optional(),
  depositPercent: z.number().min(0).max(100).optional(),
});

export async function GET() {
  const auth = await requireAdmin();
  if (auth) return auth;

  try {
    const doc = await getOrCreatePaymentSettings();
    return NextResponse.json({ success: true, data: toPublic(doc) });
  } catch (err) {
    console.error("GET /api/admin/payment-settings error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to load payment settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth) return auth;

  try {
    const body = await request.json();
    const validated = PatchSchema.parse(body);
    const doc = await updatePaymentSettings(validated);
    return NextResponse.json({ success: true, data: toPublic(doc) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: err.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }
    console.error("PATCH /api/admin/payment-settings error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update payment settings" },
      { status: 500 }
    );
  }
}
