import { NextRequest } from "next/server";
import { getOrCreateChatSettings } from "@/lib/chatSettings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW = 60 * 60 * 1000;

function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateMap) {
    if (now > v.resetAt) rateMap.delete(k);
  }
}, 10 * 60 * 1000);

const FALLBACK_SYSTEM_PROMPT = `أنت سِراج — الأرنب الأخضر صاحب ورشة الحكايات. أنت المساعد الذكي لمتجر سِراج الإلكتروني.

## شخصيتك:
- تتكلم بالعامية المصرية بأسلوب مهذب ولطيف ومحترم
- تتكلم باسم نفسك دائماً ("أنا سِراج"، "ورشة سِراج")
- مهذب ومحترم — بدون ألقاب عامية (لا "حبيبتي"، لا "يا أختي"، لا "يا باشا")
- تستخدم "أنتِ" للمؤنث و"أنت" للمذكر
- تتعامل مع كل عميل بلطف وصبر
- تساعد العميل يلاقي الأنسب لطفله — من غير ضغط ولا إلحاح

## المنتجات المتاحة:
- **قصة خالد بن الوليد** (سباق الفتوحات): 110 ج.م — قصة جاهزة مطبوعة، مناسبة من سن 4 لـ 10 سنين
- **القصة المخصصة**: 220 ج.م — قصة فريدة تتكتب باسم طفلك + القيمة اللي تختارها (شجاعة، نظافة، صبر، احترام، علم)، مناسبة من سن 3 لـ 10 سنين

## الشحن والتوصيل:
- رسوم الشحن: 40 ج.م (توصيل لباب البيت)
- الشحن المجاني: للطلبات فوق 500 ج.م
- مدة التوصيل: من 2 لـ 5 أيام عمل
- المناطق: كل محافظات مصر

## طريقة الدفع:
- الدفع عبر InstaPay فقط
- بعد تأكيد الطلب يتم إرسال بيانات الدفع

## طلب القصة المخصصة:
1. اسم الطفل
2. سن الطفل
3. القيمة (شجاعة / نظافة / صبر / احترام / علم)
4. صورة الطفل (اختياري)

## طلب قصة خالد:
1. الاسم
2. رقم الموبايل
3. عنوان التوصيل

## منتجات قريباً (غير متاحة):
- كروت الروتين اليومي
- مجموعة الأبطال الصغار
- ألعاب تعليمية

## قواعد مهمة:
1. لا تستخدم ألقاب عامية أبداً
2. لا تضغط على العميل للشراء
3. لا تعد بشيء لا تستطيع الوفاء به
4. لا تتحدث عن منتجات غير موجودة كأنها متاحة
5. لا تعطي معلومات غير مؤكدة
6. لو مش عارف إجابة — قول بصراحة واطلب التواصل مع فريق الدعم
7. البيع غير المباشر مرة واحدة فقط في المحادثة — مثلاً "لو طلبك فوق 500 الشحن مجاني!"
8. لو العميل محتاج مساعدة حقيقية أو شكوى أو طلب متابعة — اقترح عليه التواصل مباشرة عبر واتساب

## أمثلة:

عميل: إيه سراج ده؟
سِراج: أهلاً بكِ! أنا سِراج — متجر قصص أطفال مصري. بنكتب قصص مخصصة باسم طفلك بنتعلم منها قيمة حلوة زي الشجاعة أو الصبر. وكمان عندنا قصص جاهزة من سلسلة "سباق الفتوحات". تقدري تطلبي قصة لطفلك وهي توصيل لباب البيت!

عميل: الأسعار كام؟
سِراج: عندنا منتجين حالياً: قصة خالد بن الوليد (جاهزة ومطبوعة): 110 ج.م — القصة المخصصة (باسم طفلك): 220 ج.م — والشحن 40 ج.م أو مجاني لو الطلب فوق 500 ج.م

عميل: عايزة قصة لطفلي
سِراج: ممتاز! هتحتاج منكِ شوية بيانات: 1. اسم بطلنا إيه؟ 2. عنده كام سنة؟ 3. تحبي القصة تعلمه إيه؟ (شجاعة / نظافة / صبر / احترام / علم) 4. لو عندك صورة ليه ابعتيلي — اختياري بس بيخلي القصة أحلى`;

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    if (!checkRate(ip)) {
      return new Response(
        JSON.stringify({ error: "كترتي الأسئلة! استني شوية وجربي تاني" }),
        { status: 429, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    const body = await req.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "اكتبي رسالتك وأنا هرد عليكِ" }),
        { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    if (message.length > 500) {
      return new Response(
        JSON.stringify({ error: "الرسالة طويلة أوي — اختصريها شوية" }),
        { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    let systemPrompt = FALLBACK_SYSTEM_PROMPT;
    let chatEnabled = true;
    let aiProvider: "auto" | "gemini" | "deepseek" = "auto";
    let aiModelOverride = "";
    let aiTemperature = 0.7;
    let aiMaxTokens = 400;
    try {
      const settings = await getOrCreateChatSettings();
      chatEnabled = settings.enabled !== false;
      if (settings.systemPrompt && settings.systemPrompt.trim().length > 0) {
        systemPrompt = settings.systemPrompt;
      }
      if (settings.aiProvider === "gemini" || settings.aiProvider === "deepseek") {
        aiProvider = settings.aiProvider;
      }
      if (typeof settings.aiModel === "string" && settings.aiModel.trim()) {
        aiModelOverride = settings.aiModel.trim();
      }
      if (typeof settings.aiTemperature === "number") aiTemperature = settings.aiTemperature;
      if (typeof settings.aiMaxTokens === "number") aiMaxTokens = settings.aiMaxTokens;
    } catch (e) {
      console.error("chat-seraj: failed to load settings, using fallback prompt", e);
    }

    if (!chatEnabled) {
      return new Response(
        JSON.stringify({ error: "الشات معطّل حالياً" }),
        { status: 403, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    messages.push({ role: "user", content: message.trim() });

    type Provider = { name: string; call: () => Promise<Response> };
    const providers: Provider[] = [];

    const wantGemini = aiProvider === "auto" || aiProvider === "gemini";
    const wantDeepseek = aiProvider === "auto" || aiProvider === "deepseek";

    const geminiKeys = [
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY_4,
    ].filter(Boolean);
    const geminiModel =
      (aiProvider === "gemini" && aiModelOverride) ||
      process.env.GEMINI_MODEL ||
      "gemini-2.5-flash";

    if (wantGemini) {
      for (const gKey of geminiKeys) {
        providers.push({
          name: "gemini",
          call: () => {
            const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
            for (const m of messages) {
              const role = m.role === "assistant" ? "model" : "user";
              contents.push({ role, parts: [{ text: m.content }] });
            }
            if (messages[0]?.role === "system" && contents.length > 1) {
              contents[1].parts[0].text = contents[0].parts[0].text + "\n\n" + contents[1].parts[0].text;
              contents.shift();
            }

            return fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${gKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents,
                  generationConfig: { temperature: aiTemperature, maxOutputTokens: aiMaxTokens, topP: 0.9 },
                }),
              }
            );
          },
        });
      }
    }

    const dsKey = process.env.DEEPSEEK_API_KEY;
    const dsUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
    const dsModel =
      (aiProvider === "deepseek" && aiModelOverride) ||
      process.env.DEEPSEEK_MODEL ||
      "deepseek-chat";
    if (wantDeepseek && dsKey) {
      providers.push({
        name: "deepseek",
        call: () =>
          fetch(`${dsUrl}/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${dsKey}` },
            body: JSON.stringify({ model: dsModel, messages, temperature: aiTemperature, max_tokens: aiMaxTokens, top_p: 0.9, stream: true }),
          }),
      });
    }

    if (providers.length === 0) {
      return new Response(
        JSON.stringify({ error: "الشات مش متصل دلوقتي — جربي بعد كده" }),
        { status: 503, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    let providerResponse: Response | null = null;
    let usedProvider = "";

    for (const provider of providers) {
      try {
        const res = await provider.call();
        if (res.ok) {
          providerResponse = res;
          usedProvider = provider.name;
          break;
        }
      } catch {}
    }

    if (!providerResponse) {
      return new Response(
        JSON.stringify({ error: "كل الخدمات مشغولة — جربي بعد دقيقة" }),
        { status: 502, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    const encoder = new TextEncoder();

    if (usedProvider === "deepseek") {
      const stream = new ReadableStream({
        async start(controller) {
          const reader = providerResponse!.body?.getReader();
          if (!reader) { controller.close(); return; }
          const decoder = new TextDecoder();
          let buffer = "";
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";
              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith("data: ")) continue;
                const data = trimmed.slice(6);
                if (data === "[DONE]") { controller.enqueue(encoder.encode("data: [DONE]\n\n")); continue; }
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                } catch {}
              }
            }
          } catch {} finally { controller.close(); }
        },
      });
      return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
    }

    const geminiBody = await providerResponse.json();
    const text = geminiBody?.candidates?.[0]?.content?.parts?.[0]?.text || "جربي تاني";

    const stream = new ReadableStream({
      start(controller) {
        const chunkSize = 8;
        for (let i = 0; i < text.length; i += chunkSize) {
          const chunk = text.slice(i, i + chunkSize);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
  } catch (error) {
    console.error("Seraj Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "حصلت مشكلة — جربي تاني" }),
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}
