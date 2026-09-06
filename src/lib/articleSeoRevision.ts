import { createHash } from "node:crypto";
import { z } from "zod";

export const articleSeoFields = z.object({
  title: z.string().min(10).max(120),
  seoTitle: z.string().min(15).max(100),
  metaDescription: z.string().min(70).max(200),
  excerpt: z.string().min(50).max(300),
  contentMarkdown: z.string().min(100),
});

export const articleSeoRevisions = z.array(z.object({
  slug: z.string().min(1),
  beforeHash: z.string().regex(/^[a-f0-9]{64}$/),
  after: articleSeoFields,
})).min(1).refine(
  (revisions) => new Set(revisions.map((revision) => revision.slug)).size === revisions.length,
  "Each article may appear only once"
);

type ArticleSeoInput = Partial<Record<keyof z.infer<typeof articleSeoFields>, string>>;

export function articleSeoHash(article: ArticleSeoInput) {
  const fields = ["title", "seoTitle", "metaDescription", "excerpt", "contentMarkdown"] as const;
  return createHash("sha256")
    .update(JSON.stringify(fields.map((field) => article[field] ?? null)))
    .digest("hex");
}

export function articleRevisionState(current: ArticleSeoInput, revision: z.infer<typeof articleSeoRevisions>[number]) {
  const currentHash = articleSeoHash(current);
  if (currentHash === articleSeoHash(revision.after)) return "already-applied";
  if (currentHash === revision.beforeHash) return "ready";
  throw new Error(`Article changed since review: ${revision.slug}`);
}
