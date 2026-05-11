import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import GroupBuy from "@/lib/models/GroupBuy";
import { requireAdmin } from "@/lib/requireAdmin";
import { generateGroupCode, getGroupBuyConfig } from "@/lib/groupBuy/engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CreateGroupSchema = z.object({
  createdByName: z.string().min(1, "الاسم مطلوب"),
  createdByPhone: z.string().regex(/^01[0-9]{9}$/, "رقم الموبايل غير صحيح").optional().default("00000000000"),
  targetOrders: z.number().int().min(2), // How many orders they aim for based on tiers
});

/**
 * GET /api/group-buys
 * Query params: ?status=open&page=1
 * Returns all group buys (admin only)
 */
export async function GET(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    const [groups, total] = await Promise.all([
      GroupBuy.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("orderIds", "orderNumber total paymentStatus")
        .lean(),
      GroupBuy.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      count: groups.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: groups,
    });
  } catch (error) {
    console.error("GET /api/group-buys error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch group buys" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/group-buys
 * Create a new group buy (Public)
 */
export async function POST(request: Request) {
  try {
    await connectDB();
    const config = await getGroupBuyConfig();
    
    if (!config.active) {
      return NextResponse.json(
        { success: false, error: "نظام الشراء الجماعي متوقف حالياً" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = CreateGroupSchema.parse(body);

    // Make sure targetOrders matches an available tier
    const targetTier = config.defaultTiers.find(t => t.minOrders === validated.targetOrders);
    if (!targetTier) {
      return NextResponse.json(
        { success: false, error: "المستوى المطلوب غير متاح" },
        { status: 400 }
      );
    }

    // Check if user already has an open group (optional restriction, currently disabled by user request)
    // But we still shouldn't let them spam it heavily. Let's rely on basic rate limiting in middleware if needed.

    // Generate unique code
    let code = "";
    let isUnique = false;
    while (!isUnique) {
      code = generateGroupCode();
      const existing = await GroupBuy.findOne({ code }).select("_id").lean();
      if (!existing) isUnique = true;
    }

    const durationHours = config.defaultDurationHours;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + durationHours);

    const group = await GroupBuy.create({
      code,
      createdByName: validated.createdByName,
      createdByPhone: validated.createdByPhone,
      tiers: config.defaultTiers,
      targetOrders: validated.targetOrders,
      confirmedOrders: 0,
      currentTier: null,
      status: "open",
      durationHours,
      expiresAt,
      orderIds: [],
      content: {
        shareTitle: config.content.friendBannerTitle.replace("{name}", validated.createdByName),
        shareMessage: config.content.shareMessage,
        successMessage: config.content.completedTitle,
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        code: group.code,
        expiresAt: group.expiresAt,
        targetOrders: group.targetOrders,
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues.map(e => ({ field: e.path.join("."), message: e.message }))
        },
        { status: 400 }
      );
    }

    console.error("POST /api/group-buys error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create group buy" },
      { status: 500 }
    );
  }
}
