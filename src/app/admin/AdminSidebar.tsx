"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/orders", label: "الطلبات", icon: "📦" },
  { href: "/admin/products", label: "المنتجات", icon: "📚" },
  { href: "/admin/finance", label: "المالية والمخزون", icon: "💰" },
  { href: "/admin/payment-settings", label: "الدفع والعربون", icon: "💳" },
  { href: "/admin/coupons", label: "الكوبونات", icon: "🏷️" },
  { href: "/admin/articles", label: "المقالات", icon: "📝" },
  { href: "/admin/stories", label: "القصص", icon: "📖" },
  { href: "/admin/content", label: "المحتوى", icon: "✏️" },
  { href: "/admin/testimonials", label: "الآراء", icon: "💬" },
  { href: "/admin/places", label: "الأماكن", icon: "🎡" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  // Don't show layout on login page
  if (pathname === "/admin/login") {
    return null;
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <Link href="/admin" className="flex items-center gap-2">
          <img
            src="/assets/logo/logo.webp"
            alt="سِراج"
            className="w-9 h-9 object-contain rounded-lg"
          />
          <span className="text-lg font-bold">سِراج</span>
        </Link>
        <p className="text-xs text-muted-foreground mt-1">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
        >
          <span className="mr-2">🚪</span>
          خروج
        </Button>
      </div>
    </aside>
  );
}
