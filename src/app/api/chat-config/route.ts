import { NextResponse } from "next/server";
import { getOrCreateChatSettings, toPublic } from "@/lib/chatSettings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Public endpoint — returns the public-facing chat widget settings only.
 * Never exposes the system prompt.
 */
export async function GET() {
  try {
    const doc = await getOrCreateChatSettings();
    const res = NextResponse.json({ success: true, data: toPublic(doc) });
    res.headers.set(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=60"
    );
    return res;
  } catch (error) {
    console.error("GET /api/chat-config error:", error);
    // Fail-open: return safe defaults so the widget still works.
    return NextResponse.json({
      success: true,
      data: {
        enabled: true,
        whatsappNumber: "201152806034",
        welcomeTitle: "أهلاً بيك في سِراج! 👋",
        welcomeSubtitle:
          "أنا مساعدك الذكي. اسألني عن المنتجات والأسعار أو اطلب مباشرة. إيه اللي محتاجه؟",
        chips: [
          { label: "المنتجات والأسعار", question: "إيه المنتجات والأسعار؟" },
          { label: "القصة المخصصة", question: "عايز أطلب القصة المخصصة" },
          { label: "قصة خالد", question: "عايز أطلب قصة خالد بن الوليد" },
          { label: "الشحن والتوصيل", question: "الشحن بكام وبيوصل إمتى؟" },
        ],
      },
    });
  }
}
