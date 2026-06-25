import assert from "node:assert/strict";
import test from "node:test";
import Product from "../src/lib/models/Product";
import {
  optionalProductText,
  productSectionFilterValue,
} from "../src/lib/productCatalog";

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
