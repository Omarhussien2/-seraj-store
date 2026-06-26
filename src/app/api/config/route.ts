import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SiteContent from "@/lib/models/SiteContent";
import { getOrCreatePaymentSettings, toPublic as toPaymentPublic } from "@/lib/paymentSettings";
import { apiCache } from "@/lib/apiCache";

export const dynamic = "force-dynamic";

const cache = apiCache("config");
const CACHE_KEY = "__config__";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fresh = searchParams.get("fresh") === "1";

  if (!fresh) {
    const hit = cache.get(CACHE_KEY);
    if (hit) {
      return new NextResponse(hit, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "X-Cache": "HIT",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      });
    }
  }

  let shippingFee = parseInt(process.env.NEXT_PUBLIC_SHIPPING_FEE || "35", 10);
  let freeShippingAbove = parseInt(process.env.NEXT_PUBLIC_FREE_SHIPPING_ABOVE || "0", 10);
  let checkoutContinueShoppingText = "كمل تسوق";
  let checkoutDeliveryEstimateText = "عادةً الطلب بيوصل خلال 5 إلى 7 أيام عمل.";
  let depositEnabled = true;
  let depositPercent = 60;

  try {
    await connectDB();
    const settings = await SiteContent.find({
      key: {
        $in: [
          "shipping_fee",
          "free_shipping_above",
          "checkout_continue_shopping_text",
          "checkout_delivery_estimate_text",
        ],
      },
    }).lean();

    for (const s of settings) {
      if (s.key === "shipping_fee") shippingFee = parseInt(s.value, 10);
      if (s.key === "free_shipping_above") freeShippingAbove = parseInt(s.value, 10);
      if (s.key === "checkout_continue_shopping_text") checkoutContinueShoppingText = s.value;
      if (s.key === "checkout_delivery_estimate_text") checkoutDeliveryEstimateText = s.value;
    }



    try {
      const payment = toPaymentPublic(await getOrCreatePaymentSettings());
      depositEnabled = payment.depositEnabled;
      depositPercent = payment.depositPercent;
    } catch {
      // payment settings unavailable — keep defaults
    }
  } catch {
    // DB unavailable — use env var fallbacks
  }

  const body = JSON.stringify({
    success: true,
    data: {
      whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
      instaPayNumber: process.env.NEXT_PUBLIC_INSTAPAY_NUMBER || "",
      instaPayLink: process.env.NEXT_PUBLIC_INSTAPAY_LINK || "",
      instaPayName: process.env.NEXT_PUBLIC_INSTAPAY_NAME || "",
      shippingFee,
      freeShippingAbove,
      checkoutContinueShoppingText,
      checkoutDeliveryEstimateText,
      depositEnabled,
      depositPercent,
    },
  });

  cache.set(CACHE_KEY, body);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Cache": fresh ? "BYPASS" : "MISS",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
