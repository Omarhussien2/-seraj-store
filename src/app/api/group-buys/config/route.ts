import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { getGroupBuyConfig } from "@/lib/groupBuy/engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/group-buys/config
 * Public endpoint to fetch active status and UI text
 */
export async function GET() {
  try {
    await connectDB();
    const config = await getGroupBuyConfig();

    return NextResponse.json({
      success: true,
      data: {
        active: config.active,
        content: config.content,
        defaultTiers: config.defaultTiers,
        defaultDurationHours: config.defaultDurationHours,
      }
    });
  } catch (error) {
    console.error("GET /api/group-buys/config error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch config" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/group-buys/config
 * Admin endpoint to update the config
 */
export async function PUT(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();
    const body = await request.json();
    
    const config = await getGroupBuyConfig();
    
    if (body.active !== undefined) config.active = body.active;
    if (body.defaultDurationHours) config.defaultDurationHours = body.defaultDurationHours;
    if (body.defaultTiers) config.defaultTiers = body.defaultTiers;
    
    if (body.content) {
      Object.keys(body.content).forEach(key => {
        if (key in config.content) {
          // @ts-ignore - dynamic key assignment
          config.content[key] = body.content[key];
        }
      });
    }

    await config.save();

    return NextResponse.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error("PUT /api/group-buys/config error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update config" },
      { status: 500 }
    );
  }
}
