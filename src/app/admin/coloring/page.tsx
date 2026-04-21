"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ColoringAdminLayout() {
  return (
    <div dir="rtl">
      <h1 className="text-2xl font-bold mb-6">إدارة كشكول الألوان</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        <div className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition">
          <h2 className="text-xl font-bold mb-2">التسعير 💰</h2>
          <p className="text-gray-500 mb-6 font-medium">تحكمي في سعر الورقة والغلاف والحد الأدنى والأقصى</p>
          <Link href="/admin/coloring/pricing">
             <Button className="w-full">تعديل الأسعار</Button>
          </Link>
        </div>

        <div className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition">
          <h2 className="text-xl font-bold mb-2">الأقسام الرئيسية</h2>
          <p className="text-gray-500 mb-6 font-medium">إدارة فئات التلوين زي (الحيوانات، الأرقام...)</p>
          <Link href="/admin/coloring/categories">
             <Button className="w-full">إدارة الأقسام</Button>
          </Link>
        </div>
        
        <div className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition">
          <h2 className="text-xl font-bold mb-2">الرسومات والصور</h2>
          <p className="text-gray-500 mb-6 font-medium">رفع وتعديل آلاف الصور للكشكول مع ربطها بالأقسام</p>
          <Link href="/admin/coloring/items">
             <Button className="w-full">إدارة الرسومات</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
