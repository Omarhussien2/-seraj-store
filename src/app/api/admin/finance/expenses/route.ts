import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import AdditionalCost from "@/lib/models/AdditionalCost";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ExpenseSchema = z.object({
  scope: z.enum(["general", "product", "order"]),
  type: z.enum([
    "ai_subscription",
    "labor",
    "packaging",
    "actual_shipping",
    "design_printing",
    "other",
  ]),
  amount: z.number().min(0),
  description: z.string().min(1).max(500),
  productSlug: z.string().min(1).optional(),
  orderId: z.string().optional(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  incurredAt: z.string().optional(),
  allocationMethod: z.enum(["net_revenue", "units", "none"]).default("net_revenue"),
});

export async function GET(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const costs = await AdditionalCost.find({})
      .sort({ incurredAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, data: costs });
  } catch (error) {
    console.error("GET /api/admin/finance/expenses error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await connectDB();
    const body = await request.json();
    const validated = ExpenseSchema.parse(body);

    if (validated.scope === "product" && !validated.productSlug) {
      return NextResponse.json(
        { success: false, error: "productSlug is required for product costs" },
        { status: 400 }
      );
    }
    if (
      validated.scope === "order" &&
      (!validated.orderId || !mongoose.Types.ObjectId.isValid(validated.orderId))
    ) {
      return NextResponse.json(
        { success: false, error: "Valid orderId is required for order costs" },
        { status: 400 }
      );
    }

    const cost = await AdditionalCost.create({
      ...validated,
      orderId: validated.orderId ? new mongoose.Types.ObjectId(validated.orderId) : undefined,
      periodStart: validated.periodStart ? new Date(validated.periodStart) : undefined,
      periodEnd: validated.periodEnd ? new Date(validated.periodEnd) : undefined,
      incurredAt: validated.incurredAt ? new Date(validated.incurredAt) : new Date(),
    });

    return NextResponse.json({ success: true, data: cost }, { status: 201 });
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

    console.error("POST /api/admin/finance/expenses error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
