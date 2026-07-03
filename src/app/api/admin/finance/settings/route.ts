import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import FinanceSettings from "@/lib/models/FinanceSettings";
import { getOrCreateFinanceSettings } from "@/lib/financeOperations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PatchSchema = z.object({
  inventoryDeductionStatus: z.enum(["in_progress", "shipped", "delivered"]).optional(),
  defaultLowStockThreshold: z.number().min(0).optional(),
});

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await connectDB();
    const settings = await getOrCreateFinanceSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("GET /api/admin/finance/settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load finance settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await connectDB();
    const body = await request.json();
    const validated = PatchSchema.parse(body);
    const settings = await FinanceSettings.findByIdAndUpdate(
      "finance-settings",
      { $set: validated },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error("PATCH /api/admin/finance/settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update finance settings" },
      { status: 500 }
    );
  }
}
