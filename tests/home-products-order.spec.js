/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require('@playwright/test');

const productBase = {
  badge: 'متاح',
  price: 100,
  priceText: '١٠٠ ج.م',
  category: 'مجموعات',
  shortDesc: 'وصف قصير للمنتج',
  longDesc: 'وصف طويل للمنتج',
  features: [],
  imageUrl: '',
  media: { type: 'bundle-stack', bg: 'teal' },
  action: 'cart',
  ctaText: 'أضيف للسلة',
  comingSoon: false,
  active: true,
  reviews: [],
  related: [],
};

test.describe('home product ordering', () => {
  test('renders homepage product cards by API order field', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('seraj-products-cache-v1');
    });

    await page.route('**/api/products', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              ...productBase,
              slug: 'story-khaled',
              name: 'قصة خالد',
              section: 'tales',
              media: { type: 'book3d', image: 'assets/khaled-v2.png', title: 'خالد', bg: 'emerald' },
              order: 30,
            },
            {
              ...productBase,
              slug: 'external-box',
              name: 'بوكس القصص والبازل',
              section: null,
              order: 5,
            },
            {
              ...productBase,
              slug: 'custom-story',
              name: 'القصة المخصصة',
              category: 'قصص مخصصة',
              section: 'custom-stories',
              media: { type: 'book3d', image: 'assets/seraj.png', title: 'حكاية بطلنا', bg: 'emerald' },
              order: 10,
            },
          ],
        }),
      });
    });

    await page.route('**/api/config', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} }),
      });
    });

    await page.route('**/api/content', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} }),
      });
    });

    await page.route('**/api/testimonials', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.goto('http://127.0.0.1:3000/#/home', { waitUntil: 'domcontentloaded' });

    const names = page.locator('#homeProductsGrid .product-body h3');
    await expect(names.first()).toHaveText('بوكس القصص والبازل');
    await expect(names).toHaveText([
      'بوكس القصص والبازل',
      'القصة المخصصة',
      'قصة خالد',
    ]);
  });
});
