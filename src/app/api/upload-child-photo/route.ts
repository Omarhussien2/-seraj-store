import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";
import { filetypeinfo } from "magic-bytes.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Configure Cloudinary from env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * POST /api/upload-child-photo
 * Public endpoint for uploading child photos from the wizard.
 * No auth required — customers use this during checkout wizard.
 * Has strict validation: max 5MB, images only, magic bytes validation, and Cloudinary re-encoding.
 */
export async function POST(request: Request) {
  // Rate limit: 20 uploads per 10 minutes per IP
  const ip = getClientIp(request);
  if (isRateLimited(`upload-child:${ip}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json(
      { success: false, error: "طلبات رفع كتير أوي، حاول تاني بعد شوية" },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "اختاري صورة للطفل أولًا" },
        { status: 400 }
      );
    }

    // Max 5MB for child photos
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "حجم الصورة لازم يكون أقل من ٥ ميجا" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate using magic bytes to prevent spoofing
    const typeInfo = filetypeinfo(buffer);
    const isValidSignature = typeInfo.some((info) =>
      ["image/jpeg", "image/png", "image/webp"].includes(info.mime || "")
    );

    if (!isValidSignature) {
      return NextResponse.json(
        { success: false, error: "الصورة لازم تكون JPEG أو PNG أو WebP" },
        { status: 400 }
      );
    }

    const detectedMime = typeInfo.find((info) =>
      ["image/jpeg", "image/png", "image/webp"].includes(info.mime || "")
    )?.mime;
    const base64 = `data:${detectedMime};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: "seraj/children-photos",
      resource_type: "image",
      transformation: [
        { width: 800, height: 800, crop: "limit" },
        { quality: "auto:good" },
      ],
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          url: result.secure_url,
          downloadUrl: result.secure_url.replace("/upload/", "/upload/fl_attachment/"),
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/upload-child-photo error:", error);
    return NextResponse.json(
      { success: false, error: "تعذر رفع الصورة الآن، حاولي مرة تانية" },
      { status: 500 }
    );
  }
}
