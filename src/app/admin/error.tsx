"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="text-6xl">⚠️</div>
      <h2 className="text-2xl font-bold">حصلت مشكلة!</h2>
      <p className="text-muted-foreground max-w-md">
        {error.message || "حصل خطأ غير متوقع في لوحة التحكم. حاول تاني."}
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} variant="default">
          حاول تاني
        </Button>
        <Button onClick={() => (window.location.href = "/admin")} variant="outline">
          الرجوع للداشبورد
        </Button>
      </div>
    </div>
  );
}
