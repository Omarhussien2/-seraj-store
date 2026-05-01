import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SiteContent from "@/lib/models/SiteContent";

export const dynamic = "force-dynamic";

export async function GET() {
  let shippingFee = parseInt(process.env.NEXT_PUBLIC_SHIPPING_FEE || "35", 10);
  let freeShippingAbove = parseInt(process.env.NEXT_PUBLIC_FREE_SHIPPING_ABOVE || "0", 10);
  let checkoutContinueShoppingText = "كمل تسوق";
  let checkoutDeliveryEstimateText = "عادةً الطلب بيوصل خلال 5 إلى 7 أيام عمل.";
  let chatWidgetEnabled = true;
  let chatWidgetHiddenPages = "checkout,success,wizard,preview";

  try {
    await connectDB();
    const settings = await SiteContent.find({
      key: {
        $in: [
          "shipping_fee",
          "free_shipping_above",
          "checkout_continue_shopping_text",
          "checkout_delivery_estimate_text",
          "chat_widget_enabled",
          "chat_widget_hidden_pages",
        ],
      },
    }).lean();

    for (const s of settings) {
      if (s.key === "shipping_fee") shippingFee = parseInt(s.value, 10);
      if (s.key === "free_shipping_above") freeShippingAbove = parseInt(s.value, 10);
      if (s.key === "checkout_continue_shopping_text") checkoutContinueShoppingText = s.value;
      if (s.key === "checkout_delivery_estimate_text") checkoutDeliveryEstimateText = s.value;
      if (s.key === "chat_widget_enabled") chatWidgetEnabled = s.value !== "false";
      if (s.key === "chat_widget_hidden_pages") chatWidgetHiddenPages = s.value;
    }
  } catch {
    // DB unavailable — use env var fallbacks
  }

  return NextResponse.json({
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
      chatWidgetEnabled,
      chatWidgetHiddenPages,
    },
  });
}
