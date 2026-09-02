import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import Product from "../src/lib/models/Product";
import {
  optionalProductText,
  productSectionFilterValue,
} from "../src/lib/productCatalog";

const PRODUCT_TRUTH_FILES = [
  "public/app.js",
  "scripts/seed.ts",
  "scripts/seed-products.js",
  "scripts/migrate-neutralize-audience.js",
  "scripts/force-update-db.js",
];

const CUSTOM_STORY_PRODUCT_FILES = PRODUCT_TRUTH_FILES.filter(
  (path) => path !== "scripts/force-update-db.js"
);
const STORY_COPY_FILES = [
  "public/index.html",
  "scripts/force-update-db.js",
  "scripts/inject-keys.js",
  "scripts/migrate-neutralize-audience.js",
  "src/lib/seed/contentDefaults.ts",
];
const CUSTOM_STORY_RECORD = /(?:["']custom-story["']:\s*{|slug:\s*["']custom-story["'])[\s\S]{0,1200}/;
const BUNDLE_RECORD = /(?:bundle:\s*{|slug:\s*["']bundle["'])[\s\S]{0,1200}/;

function readRepoFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function externalBundleProduct(overrides = {}) {
  return {
    slug: "external-story-puzzle-box",
    name: "بوكس قصص وبازل",
    badge: "مجموعة خارجية",
    price: 350,
    priceText: "٣٥٠ ج.م",
    category: "مجموعات",
    section: null,
    longDesc: "بوكس يجمع قصص وأنشطة وبازل في منتج واحد.",
    features: ["قصص وأنشطة", "بازل مناسب للأطفال"],
    media: { type: "bundle-stack", bg: "teal" },
    gallery: [],
    action: "cart",
    ctaText: "أضف للسلة",
    comingSoon: false,
    active: true,
    order: 50,
    reviews: [],
    related: [],
    ...overrides,
  };
}

test("external bundle without a Seraj section passes product schema validation", () => {
  const product = new Product(externalBundleProduct());

  assert.equal(product.validateSync(), undefined);
  assert.equal(product.category, "مجموعات");
  assert.equal(product.section, null);
});

test("unsupported product section fails product schema validation", () => {
  const product = new Product(externalBundleProduct({ section: "external" }));
  const validationError = product.validateSync();

  assert.ok(validationError?.errors.section);
});

test("bundle section query aliases target unsectioned products", () => {
  assert.equal(productSectionFilterValue("bundle"), null);
  assert.equal(productSectionFilterValue("null"), null);
  assert.equal(productSectionFilterValue("none"), null);
  assert.equal(productSectionFilterValue("tales"), "tales");
  assert.equal(productSectionFilterValue(null), undefined);
});

test("blank optional product text is omitted before create", () => {
  assert.equal(optionalProductText(null), undefined);
  assert.equal(optionalProductText(undefined), undefined);
  assert.equal(optionalProductText("سباق الفتوحات"), "سباق الفتوحات");
});

test("fallback and seed product truth use the current custom story price", () => {
  for (const path of CUSTOM_STORY_PRODUCT_FILES) {
    const source = readRepoFile(path);

    const customStoryRecord = source.match(CUSTOM_STORY_RECORD)?.[0] || "";

    assert.match(
      customStoryRecord,
      /price:\s*310/,
      `${path} must keep custom-story at the current 310 EGP price`
    );
    assert.doesNotMatch(
      customStoryRecord,
      /price:\s*220|priceText:\s*["']٢٢٠ ج\.م["']/,
      `${path} must not restore the old 220 EGP custom-story price`
    );
  }
});

test("fallback and seed product truth keep the approved custom story positioning", () => {
  for (const path of CUSTOM_STORY_PRODUCT_FILES) {
    const customStoryRecord =
      readRepoFile(path).match(CUSTOM_STORY_RECORD)?.[0] || "";

    assert.match(
      customStoryRecord,
      /قصة مخصصة بطلها طفلك/,
      `${path} must use the approved custom-story name`
    );
    assert.match(
      customStoryRecord,
      /ليست مجرد تبديل الاسم/,
      `${path} must explain the approved custom-story distinction`
    );
    assert.doesNotMatch(
      customStoryRecord,
      /خلي طفلك بطل القصة الحقيقي|قصة كاملة باسم طفلك وصورته/,
      `${path} must not restore the superseded custom-story positioning`
    );
  }
});

test("fallback and seed product truth avoid stale specs and unverified review copy", () => {
  const staleCustomStoryClaims = [
    "٢٤ صفحة",
    "غلاف مقوّى",
    "ورق سميك",
    "فنانين مصريين",
  ];
  const staleBundleClaims = [
    "٢٤ صفحة",
    "وفّر ٢٠٪",
    "بتوفّر ١١٠",
  ];
  const staleStoryCopyClaims = [
    "غلاف مقوّى",
    "ورق سميك",
    "فنانين مصريين",
    "تغليف يفرّح القلب",
    "تتغلف بشكل عملي",
  ];
  const legacyReviewSnippets = [
    "ابني قعد يقرأ القصة",
    "ابني لسه مش مصدق",
    "القصة الجديدة من السلسلة",
    "الكروت غيّرت روتين",
    "طلبت المجموعة الكاملة",
    "الطباعة تحفة",
  ];

  for (const path of PRODUCT_TRUTH_FILES) {
    const source = readRepoFile(path);
    const customStoryRecord = source.match(CUSTOM_STORY_RECORD)?.[0] || "";
    const bundleRecord = source.match(BUNDLE_RECORD)?.[0] || "";

    for (const claim of staleCustomStoryClaims) {
      assert.equal(
        customStoryRecord.includes(claim),
        false,
        `${path} must not contain stale custom-story claim: ${claim}`
      );
    }

    for (const claim of staleBundleClaims) {
      assert.equal(
        bundleRecord.includes(claim),
        false,
        `${path} must not contain stale bundle claim: ${claim}`
      );
    }

    for (const snippet of legacyReviewSnippets) {
      assert.equal(
        source.includes(snippet),
        false,
        `${path} must not contain unverified fallback review copy: ${snippet}`
      );
    }
  }

  for (const path of STORY_COPY_FILES) {
    const source = readRepoFile(path);
    for (const claim of staleStoryCopyClaims) {
      assert.equal(
        source.includes(claim),
        false,
        `${path} must not restore stale story copy: ${claim}`
      );
    }
  }
});
