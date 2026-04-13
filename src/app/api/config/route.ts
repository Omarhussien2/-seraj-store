import { NextResponse } from "next/server";

/**
 * GET /api/config
 * Returns public-facing configuration (WhatsApp, InstaPay, etc.)
 * These values use NEXT_PUBLIC_ prefix and are safe to expose to the frontend.
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
      instaPayNumber: process.env.NEXT_PUBLIC_INSTAPAY_NUMBER || "",
      instaPayLink: process.env.NEXT_PUBLIC_INSTAPAY_LINK || "",
      instaPayName: process.env.NEXT_PUBLIC_INSTAPAY_NAME || "",
    },
  });
}
