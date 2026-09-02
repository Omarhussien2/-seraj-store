import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import Product from "../src/lib/models/Product";
import SiteContent from "../src/lib/models/SiteContent";
import {
  CUSTOM_STORY_SLUG,
  personalizedStoryProductCopy,
  personalizedStorySiteContent,
} from "../src/lib/personalizedStoryContent";

const applyChanges = process.argv.includes("--apply");

async function migrate() {
  await connectDB();

  const product = await Product.findOne({ slug: CUSTOM_STORY_SLUG })
    .select("slug name shortDesc longDesc features")
    .lean();

  if (!product) {
    throw new Error(`Product not found: ${CUSTOM_STORY_SLUG}`);
  }

  console.log(
    JSON.stringify(
      {
        mode: applyChanges ? "apply" : "dry-run",
        siteContentKeys: personalizedStorySiteContent.map((item) => item.key),
        product: {
          slug: CUSTOM_STORY_SLUG,
          currentName: product.name,
          nextName: personalizedStoryProductCopy.name,
        },
      },
      null,
      2
    )
  );

  if (!applyChanges) {
    console.log("Dry run only. Re-run with --apply after the matching code is deployed.");
    return;
  }

  await SiteContent.bulkWrite(
    personalizedStorySiteContent.map((item) => ({
      updateOne: {
        filter: { key: item.key },
        update: {
          $set: {
            section: item.section,
            value: item.value,
          },
        },
        upsert: true,
      },
    }))
  );

  const productResult = await Product.updateOne(
    { slug: CUSTOM_STORY_SLUG },
    {
      $set: {
        name: personalizedStoryProductCopy.name,
        shortDesc: personalizedStoryProductCopy.shortDescription,
        longDesc: personalizedStoryProductCopy.longDescription,
        features: [...personalizedStoryProductCopy.features],
      },
    }
  );

  if (productResult.matchedCount !== 1) {
    throw new Error(`Expected one ${CUSTOM_STORY_SLUG} product, matched ${productResult.matchedCount}`);
  }

  console.log("SEO content migration applied successfully.");
}

migrate()
  .catch((error) => {
    console.error("SEO content migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
