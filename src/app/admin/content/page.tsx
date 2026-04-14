// Use React cache to dedup
export const dynamic = "force-dynamic";

import { connectDB } from "@/lib/db";
import SiteContent from "@/lib/models/SiteContent";
import ContentEditor from "./ContentEditor";

export default async function AdminContentPage() {
  await connectDB();
  const contents = await SiteContent.find({}).lean();
  
  // Convert DB array to grouped format
  const grouped: Record<string, Record<string, string>> = {};
  contents.forEach((doc) => {
    const { section, key, value } = doc as any;
    if (!grouped[section]) grouped[section] = {};
    grouped[section][key] = value;
  });

  return (
    <div className="max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة المحتوى</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            يمكنك تعديل جميع نصوص المتجر من هنا وستظهر فورا للمستخدمين.
          </p>
        </div>
      </div>

      <ContentEditor initialData={grouped} />
    </div>
  );
}
