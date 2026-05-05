import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import SiteContent from "@/lib/models/SiteContent";
import { apiCache } from "@/lib/apiCache";

export const dynamic = "force-dynamic";

const configCache = apiCache("config");
const contentCache = apiCache("content");

const SETTINGS_KEYS = [
  "shipping_fee",
  "free_shipping_above",
  "checkout_continue_shopping_text",
  "checkout_delivery_estimate_text",
];

// Legacy chat keys — read so legacy callers still get a coherent shape, but
// chat widget visibility is now managed through ChatSettings (see /admin/chat-settings).

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await connectDB();
    const settings = await SiteContent.find({ key: { $in: SETTINGS_KEYS } }).lean();

    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }

    return NextResponse.json({
      success: true,
      data: {
        shippingFee: parseInt(result.shipping_fee || "35", 10),
        freeShippingAbove: parseInt(result.free_shipping_above || "0", 10),
        checkoutContinueShoppingText:
          result.checkout_continue_shopping_text || "كمل تسوق",
        checkoutDeliveryEstimateText:
          result.checkout_delivery_estimate_text ||
          "عادةً الطلب بيوصل خلال 5 إلى 7 أيام عمل.",
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
    const {
      shippingFee,
      freeShippingAbove,
      checkoutContinueShoppingText,
      checkoutDeliveryEstimateText,
    } = body;

    const updates: { key: string; value: string; section: string }[] = [];

    if (typeof shippingFee === "number" && shippingFee >= 0) {
      updates.push({ key: "shipping_fee", value: String(shippingFee), section: "shipping" });
    }
    if (typeof freeShippingAbove === "number" && freeShippingAbove >= 0) {
      updates.push({ key: "free_shipping_above", value: String(freeShippingAbove), section: "shipping" });
    }
    if (typeof checkoutContinueShoppingText === "string" && checkoutContinueShoppingText.trim()) {
      updates.push({
        key: "checkout_continue_shopping_text",
        value: checkoutContinueShoppingText.trim(),
        section: "checkout",
      });
    }
    if (typeof checkoutDeliveryEstimateText === "string" && checkoutDeliveryEstimateText.trim()) {
      updates.push({
        key: "checkout_delivery_estimate_text",
        value: checkoutDeliveryEstimateText.trim(),
        section: "checkout",
      });
    }
    for (const u of updates) {
      await SiteContent.findOneAndUpdate(
        { key: u.key },
        { value: u.value, section: u.section },
        { upsert: true, new: true }
      );
    }

    configCache.invalidate();
    contentCache.invalidate();

    // Re-read stored values so the response reflects what was actually persisted
    // (e.g. empty strings are rejected by .trim() checks above)
    const saved = await SiteContent.find({ key: { $in: SETTINGS_KEYS } }).lean();
    const savedMap: Record<string, string> = {};
    for (const s of saved) savedMap[s.key] = s.value;

    return NextResponse.json({
      success: true,
      data: {
        shippingFee: parseInt(savedMap.shipping_fee || "35", 10),
        freeShippingAbove: parseInt(savedMap.free_shipping_above || "0", 10),
        checkoutContinueShoppingText:
          savedMap.checkout_continue_shopping_text || "كمل تسوق",
        checkoutDeliveryEstimateText:
          savedMap.checkout_delivery_estimate_text ||
          "عادةً الطلب بيوصل خلال 5 إلى 7 أيام عمل.",
      },
    });
  } catch (error) {
    console.error("PUT /api/admin/settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
