import { z } from "zod";

const envSchema = z.object({
  // Database
  MONGODB_URI: z.string().url(),
  
  // Auth
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  CLOUDINARY_UPLOAD_PRESET: z.string().optional(),
  
  // Public
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().optional(),
  NEXT_PUBLIC_INSTAPAY_NUMBER: z.string().optional(),
  NEXT_PUBLIC_INSTAPAY_NAME: z.string().optional(),
  NEXT_PUBLIC_INSTAPAY_LINK: z.string().url().optional(),
  
  // Admin
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD_HASH: z.string().min(1).describe("Bcrypt hash for admin password"),
  
  // Development
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
