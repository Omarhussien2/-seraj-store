import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

test("personalized-story homepage uses semantic CMS keys", () => {
  const html = source("public/index.html");
  const app = source("public/app.js");

  assert.match(html, /data-content-key="hero\.story_title"/);
  assert.match(html, /data-content-key="hero\.cta_custom_story"/);
  assert.match(html, /data-content-key="hero\.cta_products"/);
  assert.match(html, /data-content-key="showcase\.custom_story\.title"/);
  assert.doesNotMatch(html, /data-content-key="hero\.cta_primary"/);
  assert.doesNotMatch(html, /data-content-key="hero\.cta_secondary"/);
  assert.match(app, /p\.slug === 'custom-story'/);
  assert.match(app, /p\.longDesc = fallback\.longDesc/);
});

test("published personalized-story copy avoids absolute likeness promises and typo", () => {
  const files = [
    "public/app.js",
    "public/index.html",
    "src/lib/personalizedStoryContent.ts",
    "src/lib/seoCategories.ts",
    "src/app/how-personalized-stories-work/page.tsx",
    "src/app/personalized-gifts-for-children/page.tsx",
  ];

  for (const path of files) {
    const text = source(path);
    assert.doesNotMatch(text, /بيثبت ملامح|ملامح[^\n]{0,40}تفضل ثابتة|ثابتة من أول صفحة لآخر صفحة/);
    assert.doesNotMatch(text, /جرب هدية ها تتذكر/);
  }
});

test("SEO rollout includes routes and a guarded production migration", () => {
  const sitemap = source("src/app/sitemap.ts");
  const migration = source("scripts/migrate-seo-content.ts");

  assert.match(sitemap, /\/how-personalized-stories-work/);
  assert.match(sitemap, /\/personalized-gifts-for-children/);
  assert.match(migration, /process\.argv\.includes\("--apply"\)/);
  assert.match(migration, /upsert: true/);
  assert.match(migration, /Product\.updateOne/);
});
