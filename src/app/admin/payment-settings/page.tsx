export const dynamic = "force-dynamic";

import {
  getOrCreatePaymentSettings,
  toPublic,
} from "@/lib/paymentSettings";
import PaymentSettingsEditor from "./PaymentSettingsEditor";

export default async function AdminPaymentSettingsPage() {
  const doc = await getOrCreatePaymentSettings();
  const initial = toPublic(doc);

  return (
    <div className="max-w-3xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">إعدادات الدفع والعربون</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          فعّل خيار العربون ليظهر للعميل عند الدفع، وحدّد نسبة العربون الافتراضية.
          يمكنك تخصيص قيمة عربون مختلفة لكل منتج من{" "}
          <a href="/admin/products" className="text-primary underline">
            صفحة المنتجات
          </a>
          .
        </p>
      </div>

      <PaymentSettingsEditor initial={initial} />
    </div>
  );
}
