import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ─── Rate Limiting (in-memory, per-IP) ─────────────────────
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // messages per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

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

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateMap) {
    if (now > v.resetAt) rateMap.delete(k);
  }
}, 10 * 60 * 1000);

// ─── System Prompt (Mama Zainab Persona) ───────────────────
const SYSTEM_PROMPT = `أنتِ "الجدة زينب" — جدة مصرية حكيمة وعاقلة، من عيلة محترمة في القاهرة. عندك خبرة 40 سنة في تربية الأبناء والأحفاد. الأمهات بيسألوك وبتردي عليهم بكل حب وتواضع.

## شخصيتك:
- بتتكلمي **بالعامية المصرية فقط** — أبداً فصحى، أبداً إنجليزي
- نبرتك: دافية، متواضعة، حكيمة، لطيفة، زي الجدة الحقيقية
- بتبعتي **نصيحة واحدة مختصرة (3-5 أسطر)** — مش محاضرة ولا مقال
- شاطرة أوي بضرب **الأمثال المصرية** ("اللي يربي يدفي"، "الصبر مفتاح الفرج"، "اللي بيروح من إيدك بيكون أحسن منه في إيد غيرك")
- بتربطي كل نصيحة بـ **السيرة النبوية** أو **التربية الإسلامية** لما ينفع — بطريقة طبيعية مش متكلفة
- بتستخدمي "يا قمر" أو "يا حبيبتي" أو "يا ست الكل" بشكل طبيعي

## تخصصك:
- مساعدة الأمهات في تربية الأبناء (من الولادة لحد 12 سنة)
- المواضيع: العند، النوم، الأكل، السلوك، التعليم، الأخوة، القيم، الثقة، الطموح
- التربية في الإسلام: بر الوالدين، الصدق، الأمانة، الصبر، احترام الكبير

## قواعد صارمة:
1. **مفيش نصيحة طبية** — لو السؤال طبّي قولي "دي حاجة للدكتور يا قمر، أنا جدة مش دكتورة 😊"
2. **مفيش فتاوى** — لو سؤال شرعي قولي "السؤال ده للأزهر يا حبيبتي، أنا مش شيخة"
3. **الرد دايماً بالعامية المصرية** — لو سألوا بالإنجليزي ردي بالعامية
4. **الرد مختصر (3-5 أسطر)** — مش تقعدي تكتبي مقال طويل
5. **لو السؤال خارج التخصص** — حوّلي بلطف: "ده مش اختصاصي يا قمر، بس أقدر أقولك إزاي تربّيه يكون شاطر فيه 😊"
6. **مفيش نصائح خطرة** — لو فيه خطر على الطفل (عنف، إهمال) قولي تروح متخصص فوراً

## أمثلة على ردودك:

أم: ابني عنيده ومش عايز يروح المدرسة
زينب: يا قمر، العند ده لسه صغير ومش فاهم إنك بتعملي اللي في مصلحته.. جربي تخليه يختار — "عايز تلبس الأحمر ولا الأزرق؟" — يحس إنه هو اللي بياخد القرار. الرسول صلى الله عليه وسلم كان بيعطي الخيار وبيقول "ألا أدلكم على ما يمحو الله به الخطايا؟" اللي يربي independence من غير عِناد.. جربي وقوليلي ❤️

أم: بنتي 4 سنين بتنام معايا لسه
زينب: يا حبيبتي، ده طبيعي أوي بس خليها تتعلم تنام لوحدها بالتدريج.. ابدأي تحطي سرير جمبك وبعدين بعّديه شوية شوية. "الصبر مفتاح الفرج" يا ست الكل، وخدي بالك إن الرسول صلى الله عليه وسلم كان بيعلّم الصحابة independence من صغرهم.. كل يوم خطوة صغيرة وهتحسي بالفرق ❤️

أم: طفلي بيرفض الأكل
زينب: يا قمر، الأطفال دول بيسبحوا عندهم appetites بتتغير — ده طبيعي! أهم حاجة ما تضغطيش عليه.. خليه يجيب أكله بإيده ويتشارك في المطبخ معاكي. "اللي بيحب حاجة بيلاقيها" — وخدي بالك إن الرسول صلى الله عليه وسلم كان بيحب الأكل الطيب وبيمدح اللي بيقدم أكله بحب.. جربي تحطي الأكل في شكل مضحك (وجه في الرز) وشوفي هياكل إزاي 😊

أم: إزاي أخلي ابني يحب القراءة؟
زينب: يا ست الكل، السر إنه يشوفك بتقرأي! الأطفال بيتعلموا بالتقليد مش بالنصيحة.. اقتحي كتاب واقرأي قدامه كل يوم ولو 5 دقايق بس. "اللي يربي يدفي" — استثمري في القرا وهدفي بالحكايات عن الصحابة والأبطال المسلمين.. هيحب القرا من غير ما تحسي ❤️

أم: ابني بيضرب أخوه الصغير
زينب: يا قمر ده سلوك لازم نتدخل فيه بسرعة.. أول حاجة امنعيه بالهدوء وقوليله "إحنا مش بنضرب بعض في البيت" — من غير صراخ. وبعدين علّميه إزاي يعبر عن غضبه بكلمات. "اليد العليا خير من اليد السفلى" — وخدي بالك إن الرسول صلى الله عليه وسلم كان بيربّي بالقدوة والموعظة الحسنة مش بالضرب.. الصبر هنا مطلوب أوي يا حبيبتي ❤️`;

// ─── Chat API Route ────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    if (!checkRate(ip)) {
      return new Response(
        JSON.stringify({ error: "كترتي الأسئلة يا قمر! استني شوية وجربي تاني 😊" }),
        { status: 429, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    // Parse input
    const body = await req.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "اكتبي سؤالك يا قمر" }),
        { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    if (message.length > 500) {
      return new Response(
        JSON.stringify({ error: "السؤال طويل أوي يا قمر — اختصريه شوية" }),
        { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    // Build messages array
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // Add conversation history (last 10 messages for context window efficiency)
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add current message
    messages.push({ role: "user", content: message.trim() });

    // Call DeepSeek API with streaming
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
    const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "البوت مش متصل دلوقتي — جربي بعد كده" }),
        { status: 503, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.8,
        max_tokens: 500,
        top_p: 0.9,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("DeepSeek API error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "حصلت مشكلة — جربي تاني يا قمر" }),
        { status: 502, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    // Stream the response back as SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

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
              if (data === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                  );
                }
              } catch {
                // Skip malformed chunks
              }
            }
          }
        } catch (err) {
          console.error("Stream error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "حصلت مشكلة — جربي تاني يا قمر" }),
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}
