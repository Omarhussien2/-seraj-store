import { NextResponse } from "next/server";
import { getOrCreateChatSettings, toPublic } from "@/lib/chatSettings";
import { apiCache } from "@/lib/apiCache";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const cache = apiCache("chat-config");
const CACHE_KEY = "__chat_config__";

/**
 * Public endpoint — returns the public-facing chat widget settings only.
 * Never exposes the system prompt.
 */
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

  try {
    const doc = await getOrCreateChatSettings();
    const body = JSON.stringify({ success: true, data: toPublic(doc) });
    cache.set(CACHE_KEY, body);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Cache": fresh ? "BYPASS" : "MISS",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
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
