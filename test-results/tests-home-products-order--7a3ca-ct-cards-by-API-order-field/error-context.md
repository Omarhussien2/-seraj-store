# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\home-products-order.spec.js >> home product ordering >> renders homepage product cards by API order field
- Location: tests\home-products-order.spec.js:23:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3000/#/home
Call log:
  - navigating to "http://127.0.0.1:3000/#/home", waiting until "domcontentloaded"

```

# Test source

```ts
  1  | /* eslint-disable @typescript-eslint/no-require-imports */
  2  | const { test, expect } = require('@playwright/test');
  3  | 
  4  | const productBase = {
  5  |   badge: 'متاح',
  6  |   price: 100,
  7  |   priceText: '١٠٠ ج.م',
  8  |   category: 'مجموعات',
  9  |   shortDesc: 'وصف قصير للمنتج',
  10 |   longDesc: 'وصف طويل للمنتج',
  11 |   features: [],
  12 |   imageUrl: '',
  13 |   media: { type: 'bundle-stack', bg: 'teal' },
  14 |   action: 'cart',
  15 |   ctaText: 'أضيف للسلة',
  16 |   comingSoon: false,
  17 |   active: true,
  18 |   reviews: [],
  19 |   related: [],
  20 | };
  21 | 
  22 | test.describe('home product ordering', () => {
  23 |   test('renders homepage product cards by API order field', async ({ page }) => {
  24 |     await page.addInitScript(() => {
  25 |       localStorage.removeItem('seraj-products-cache-v1');
  26 |     });
  27 | 
  28 |     await page.route('**/api/products', async route => {
  29 |       await route.fulfill({
  30 |         status: 200,
  31 |         contentType: 'application/json',
  32 |         body: JSON.stringify({
  33 |           success: true,
  34 |           data: [
  35 |             {
  36 |               ...productBase,
  37 |               slug: 'story-khaled',
  38 |               name: 'قصة خالد',
  39 |               section: 'tales',
  40 |               media: { type: 'book3d', image: 'assets/khaled-v2.png', title: 'خالد', bg: 'emerald' },
  41 |               order: 30,
  42 |             },
  43 |             {
  44 |               ...productBase,
  45 |               slug: 'external-box',
  46 |               name: 'بوكس القصص والبازل',
  47 |               section: null,
  48 |               order: 5,
  49 |             },
  50 |             {
  51 |               ...productBase,
  52 |               slug: 'custom-story',
  53 |               name: 'القصة المخصصة',
  54 |               category: 'قصص مخصصة',
  55 |               section: 'custom-stories',
  56 |               media: { type: 'book3d', image: 'assets/seraj.png', title: 'حكاية بطلنا', bg: 'emerald' },
  57 |               order: 10,
  58 |             },
  59 |           ],
  60 |         }),
  61 |       });
  62 |     });
  63 | 
  64 |     await page.route('**/api/config', async route => {
  65 |       await route.fulfill({
  66 |         status: 200,
  67 |         contentType: 'application/json',
  68 |         body: JSON.stringify({ success: true, data: {} }),
  69 |       });
  70 |     });
  71 | 
  72 |     await page.route('**/api/content', async route => {
  73 |       await route.fulfill({
  74 |         status: 200,
  75 |         contentType: 'application/json',
  76 |         body: JSON.stringify({ success: true, data: {} }),
  77 |       });
  78 |     });
  79 | 
  80 |     await page.route('**/api/testimonials', async route => {
  81 |       await route.fulfill({
  82 |         status: 200,
  83 |         contentType: 'application/json',
  84 |         body: JSON.stringify({ success: true, data: [] }),
  85 |       });
  86 |     });
  87 | 
> 88 |     await page.goto('http://127.0.0.1:3000/#/home', { waitUntil: 'domcontentloaded' });
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3000/#/home
  89 | 
  90 |     const names = page.locator('#homeProductsGrid .product-body h3');
  91 |     await expect(names.first()).toHaveText('بوكس القصص والبازل');
  92 |     await expect(names).toHaveText([
  93 |       'بوكس القصص والبازل',
  94 |       'القصة المخصصة',
  95 |       'قصة خالد',
  96 |     ]);
  97 |   });
  98 | });
  99 | 
```