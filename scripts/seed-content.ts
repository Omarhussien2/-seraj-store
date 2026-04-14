import mongoose from "mongoose";
import SiteContent from "../src/lib/models/SiteContent";
import { DEFAULT_CONTENT } from "../src/lib/seed/contentDefaults";

// Load local env vars for standalone script execution
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function seedContent() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);

    console.log(`Seeding ${DEFAULT_CONTENT.length} default content items...`);
    let inserted = 0;
    
    for (const item of DEFAULT_CONTENT) {
      const result = await SiteContent.updateOne(
        { key: item.key },
        { 
          $setOnInsert: { 
            value: item.value, 
            section: item.section 
          } 
        },
        { upsert: true }
      );
      
      if (result.upsertedId) inserted++;
    }

    console.log(`✅ Seeding complete. Inserted ${inserted} new keys.`);
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seedContent();
