import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SiteContent from "@/lib/models/SiteContent";

export const dynamic = "force-dynamic";

export async function GET() {
  let shippingFee = parseInt(process.env.NEXT_PUBLIC_SHIPPING_FEE || "35", 10);
  let freeShippingAbove = parseInt(process.env.NEXT_PUBLIC_FREE_SHIPPING_ABOVE || "0", 10);

  try {
    await connectDB();
    const settings = await SiteContent.find({
      key: { $in: ["shipping_fee", "free_shipping_above"] },
    }).lean();

    for (const s of settings) {
      if (s.key === "shipping_fee") shippingFee = parseInt(s.value, 10);
      if (s.key === "free_shipping_above") freeShippingAbove = parseInt(s.value, 10);
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
    },
  });
}
