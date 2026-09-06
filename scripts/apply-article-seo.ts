import { readFileSync } from "node:fs";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import Article from "../src/lib/models/Article";
import { articleRevisionState, articleSeoRevisions } from "../src/lib/articleSeoRevision";

async function applyArticleSeo() {
  const revisions = articleSeoRevisions.parse(JSON.parse(
    readFileSync("content/seo-articles/editorial-revisions.json", "utf8")
  ));
  await connectDB();
  const session = await mongoose.startSession();
  const apply = process.argv.includes("--apply");
  let changed = 0;
  let alreadyApplied = 0;
  try {
    await session.withTransaction(async () => {
      changed = 0;
      alreadyApplied = 0;
      for (const revision of revisions) {
        const current = await Article.findOne({
          slug: revision.slug, active: true, publishedAt: { $ne: null, $lte: new Date() },
        }).session(session).lean();
        if (!current) throw new Error(`Published article missing: ${revision.slug}`);
        if (articleRevisionState(current, revision) === "already-applied") {
          alreadyApplied++;
          continue;
        }
        if (apply) {
          const write = await Article.updateOne(
            { _id: current._id, updatedAt: current.updatedAt },
            { $set: revision.after },
            { session, runValidators: true }
          );
          if (write.modifiedCount !== 1) throw new Error(`Concurrent article update: ${revision.slug}`);
        }
        changed++;
      }
    });
    console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", articles: revisions.length, changed, alreadyApplied }));
  } finally {
    await session.endSession();
  }
}

applyArticleSeo().catch((error) => {
  console.error("Article SEO update failed:", error.message);
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
