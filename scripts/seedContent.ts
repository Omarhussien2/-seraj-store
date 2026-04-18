import { connectDB } from "../src/lib/db";
import SiteContent from "../src/lib/models/SiteContent";
import { DEFAULT_CONTENT } from "../src/lib/seed/contentDefaults";

async function seedContent() {
  console.log("🌱 Connecting to MongoDB...");
  await connectDB();

  console.log("📦 Seeding missing content keys...");
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

  console.log(`✅ Seeded or updated ${updated} missing content keys.`);
  process.exit(0);
}

seedContent().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
