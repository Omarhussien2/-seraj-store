/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const staleApiProduct = {
  slug: "custom-story",
  name: "اسم قديم من قاعدة البيانات",
  badge: "مخصصة باسم بطلنا",
  price: 310,
  priceText: "310 ج.م",
  category: "قصص مخصصة",
  section: "custom-stories",
  shortDesc: "وصف قديم",
  longDesc: "محتوى قديم لا يجب أن يعود للواجهة",
  features: ["ميزة قديمة"],
  media: { type: "book3d", image: "assets/seraj.png", title: "حكاية بطلنا", bg: "emerald" },
  gallery: [],
  action: "wizard",
  ctaText: "ابدأ القصة",
  comingSoon: false,
  active: true,
  order: 1,
  reviews: [],
  related: [],
};

async function mockSpaApis(page) {
  await page.route("**/api/products", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: [staleApiProduct] }),
    })
  );
  await page.route("**/api/content", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          hero: {
            "hero.title": "عنوان قديم", "hero.story_title": "قصة أطفال مخصصة قديمة",
            "hero.cta_primary": "استكشف عالم سراج",
            "hero.cta_secondary": "اصنع قصة لابنك",
          },
          showcase: {
            "showcase.cat2.title": "عنوان قسم قديم",
            "showcase.cat2.desc": "وصف قسم قديم",
          },
        },
      }),
    })
  );
  await page.route("**/api/config", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"success":true,"data":{}}' })
  );
  await page.route("**/api/testimonials", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"success":true,"data":[]}' })
  );
}

test("legacy DB content cannot swap homepage CTA meaning or restore stale product copy", async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await mockSpaApis(page);
  await page.goto("/#/home", { waitUntil: "networkidle" });

  await expect(page.locator(".hero h1")).toContainText("قصص أطفال وألعاب");
  const ctas = page.locator(".hero-ctas a");
  await expect(ctas.nth(0)).toContainText("ابدأ قصة طفلك");
  await expect(ctas.nth(0)).toHaveAttribute("href", "#/product/custom-story");
  await expect(ctas.nth(1)).toContainText("استكشف عالم سراج");
  await expect(ctas.nth(1)).toHaveAttribute("href", "#/products");
  await expect(page.locator('[data-content-key="showcase.custom_story.title"]')).toContainText("بطلها طفلك");

  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow, `homepage overflow at ${width}px`).toBeLessThanOrEqual(0);
  }

  await page.goto("/#/product/custom-story", { waitUntil: "networkidle" });
  await expect(page.locator(".pd-title")).toContainText("قصة مخصصة بطلها طفلك");
  await expect(page.locator(".pd-desc")).toContainText("مش مجرد اسم وصورة داخل حكاية جاهزة");
  await expect(page.locator("body")).not.toContainText("محتوى قديم لا يجب أن يعود للواجهة");
});

for (const route of [
  {
    path: "/how-personalized-stories-work",
    h1: "من صورة طفلك إلى بطل حكاية كاملة",
  },
  {
    path: "/personalized-gifts-for-children",
    h1: "ابعت له حكاية بطلها هو",
  },
]) {
  test(`${route.path} exposes indexable metadata and valid JSON-LD`, async ({ page }) => {
    const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText(route.h1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://seraj-store.vercel.app${route.path}`
    );
    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    expect(() => JSON.parse(jsonLd || "")).not.toThrow();
  });
}
