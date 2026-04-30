export const dynamic = "force-dynamic";

import { getOrCreateChatSettings, toAdmin } from "@/lib/chatSettings";
import ChatSettingsEditor from "./ChatSettingsEditor";

export default async function AdminChatSettingsPage() {
  const doc = await getOrCreateChatSettings();
  const initial = toAdmin(doc);

  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">إعدادات سِراج (الشات)</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          تحكم كامل في ودجت الشات: تشغيل/إيقاف، رسالة الترحيب، الاقتراحات السريعة، رقم الواتساب، وشخصية الذكاء الاصطناعي.
        </p>
      </div>

      <ChatSettingsEditor initial={initial} />
    </div>
  );
}
