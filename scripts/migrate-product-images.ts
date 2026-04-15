/**
 * One-time migration: for products where media.image is a Cloudinary URL
 * and imageUrl is empty, move the Cloudinary URL to imageUrl.
 *
 * Run: npx tsx scripts/migrate-product-images.ts
 */
import { connectDB } from "../src/lib/db";
import Product from "../src/lib/models/Product";

async function migrate() {
  await connectDB();

  const products = await Product.find({});
  let migrated = 0;

  for (const product of products) {
    const mediaImage = product.media?.image || "";
    const hasCloudinaryMedia = mediaImage.includes("res.cloudinary.com");
    const hasImageUrl = !!product.imageUrl;

    if (hasCloudinaryMedia && !hasImageUrl) {
      product.imageUrl = mediaImage;
      await product.save();
      migrated++;
      console.log(`✅ ${product.slug}: moved media.image → imageUrl`);
    } else if (hasImageUrl) {
      console.log(`⏭️  ${product.slug}: already has imageUrl`);
    } else {
      console.log(`⏭️  ${product.slug}: no Cloudinary image to migrate`);
    }
  }

  console.log(`\nDone. Migrated ${migrated} product(s).`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
