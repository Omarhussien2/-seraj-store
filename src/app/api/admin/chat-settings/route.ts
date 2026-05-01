import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import {
  getOrCreateChatSettings,
  toAdmin,
  updateChatSettings,
  type ChatSettingsAdmin,
} from "@/lib/chatSettings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const doc = await getOrCreateChatSettings();
    return NextResponse.json({ success: true, data: toAdmin(doc) });
  } catch (error) {
    console.error("GET /api/admin/chat-settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load chat settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = (await request.json()) as Partial<ChatSettingsAdmin>;
    const doc = await updateChatSettings(body);
    return NextResponse.json({ success: true, data: toAdmin(doc) });
  } catch (error) {
    console.error("PUT /api/admin/chat-settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update chat settings" },
      { status: 500 }
    );
  }
}
