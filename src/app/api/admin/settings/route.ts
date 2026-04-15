import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import SiteContent from "@/lib/models/SiteContent";

export const dynamic = "force-dynamic";

const SHIPPING_KEYS = ["shipping_fee", "free_shipping_above"];

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await connectDB();
    const settings = await SiteContent.find({ key: { $in: SHIPPING_KEYS } }).lean();

    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }

    return NextResponse.json({
      success: true,
      data: {
        shippingFee: parseInt(result.shipping_fee || "35", 10),
        freeShippingAbove: parseInt(result.free_shipping_above || "0", 10),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await connectDB();
    const body = await request.json();
    const { shippingFee, freeShippingAbove } = body;

    const updates: { key: string; value: string; section: string }[] = [];

    if (typeof shippingFee === "number" && shippingFee >= 0) {
      updates.push({ key: "shipping_fee", value: String(shippingFee), section: "shipping" });
    }
    if (typeof freeShippingAbove === "number" && freeShippingAbove >= 0) {
      updates.push({ key: "free_shipping_above", value: String(freeShippingAbove), section: "shipping" });
    }

    for (const u of updates) {
      await SiteContent.findOneAndUpdate(
        { key: u.key },
        { value: u.value, section: u.section },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({ success: true, data: { shippingFee, freeShippingAbove } });
  } catch (error) {
    console.error("PUT /api/admin/settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
