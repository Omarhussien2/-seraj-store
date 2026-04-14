import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAdmin } from "@/lib/requireAdmin";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Configure Cloudinary from env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Allowed MIME types for images and videos
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

// Max file sizes
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB for images
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB for videos

/**
 * POST /api/upload
 * Accepts FormData with one or more files, uploads to Cloudinary (admin only).
 * Supports both images and videos.
 *
 * Single file:  FormData { file: File }
 * Multiple:     FormData { files: File, files: File, ... }
 *
 * Returns an array of uploaded file metadata.
 */
export async function POST(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const formData = await request.formData();

    // Collect files from both "file" (single) and "files" (multiple) keys
    const files: File[] = [];

    const singleFile = formData.get("file") as File | null;
    if (singleFile && singleFile.size > 0) {
      files.push(singleFile);
    }

    const multipleFiles = formData.getAll("files");
    for (const f of multipleFiles) {
      if (f instanceof File && f.size > 0) {
        files.push(f);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 }
      );
    }

    // Cap at 20 files per request to prevent abuse
    if (files.length > 20) {
      return NextResponse.json(
        { success: false, error: "Too many files. Max 20 per request." },
        { status: 400 }
      );
    }

    // Validate all files before uploading any
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid file type "${file.type}" for "${file.name}". Allowed: JPEG, PNG, WebP, GIF, MP4, WebM, MOV`,
          },
          { status: 400 }
        );
      }

      const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
      const maxLabel = isVideo ? "50MB" : "10MB";

      if (file.size > maxSize) {
        return NextResponse.json(
          {
            success: false,
            error: `File "${file.name}" too large. Max for ${isVideo ? "video" : "image"}: ${maxLabel}`,
          },
          { status: 400 }
        );
      }
    }

    // Upload all files in parallel
    const uploadPromises = files.map(async (file) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

      const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

      const uploadOptions: Record<string, unknown> = {
        folder: isVideo ? "seraj/product-videos" : "seraj/product-images",
        resource_type: isVideo ? "video" : "image",
      };

      // Apply image-specific transformations
      if (!isVideo) {
        uploadOptions.transformation = [
          { width: 1200, height: 1200, crop: "limit" },
          { quality: "auto:good" },
        ];
      }

      // Apply video-specific settings
      if (isVideo) {
        uploadOptions.eager = [
          { format: "mp4", video_codec: "h264", quality: "auto" },
        ];
        uploadOptions.eager_async = true;
      }

      const result = await cloudinary.uploader.upload(base64, uploadOptions);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        resourceType: result.resource_type as string,
        bytes: result.bytes,
        duration: isVideo ? result.duration : undefined,
        originalFilename: file.name,
      };
    });

    const results = await Promise.all(uploadPromises);

    return NextResponse.json(
      {
        success: true,
        count: results.length,
        data: results,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload files" },
      { status: 500 }
    );
  }
}
