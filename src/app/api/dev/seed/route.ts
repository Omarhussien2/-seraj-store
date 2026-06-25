import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SiteContent from "@/lib/models/SiteContent";
import { DEFAULT_CONTENT } from "@/lib/seed/contentDefaults";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    
    // Upsert every content key
    let updated = 0;
    for (const item of DEFAULT_CONTENT) {
      const res = await SiteContent.updateOne(
        { key: item.key },
        {
          $setOnInsert: { section: item.section },
          $set: { value: item.value }
        },
        { upsert: true }
      );
      if (res.upsertedCount > 0 || res.modifiedCount > 0) updated++;
    }

    return NextResponse.json({ success: true, seededCount: DEFAULT_CONTENT.length, updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
