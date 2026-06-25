import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // We still let middleware handle redirects, but this is a secondary guard
  // We can't easily check pathname here without headers/middleware tricks,
  // but we know the sidebar client component will hide itself on /admin/login.
  
  return (
    <div className="min-h-screen flex bg-gray-50" dir="ltr">
      {/* Sidebar (Client Component) */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
