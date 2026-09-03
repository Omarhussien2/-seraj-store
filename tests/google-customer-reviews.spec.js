/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require('@playwright/test');

const googleReview = {
  merchant_id: 5847247567,
  order_id: 'SRJ-2026-0042',
  email: 'buyer@example.com',
  delivery_country: 'EG',
  estimated_delivery_date: '2026-09-14',
};

async function stubStorefront(page, onOrder) {
  await page.route('**/api/products', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data: [] }),
  }));
  await page.route('**/api/config', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data: { shippingFee: 40, freeShippingAbove: 500 } }),
  }));
  await page.route('**/api/content', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data: {} }),
  }));
  await page.route('**/api/testimonials', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data: [] }),
  }));
  await page.route('**/api/promotions/active', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data: null }),
  }));
  await page.route('**/api/orders', async route => {
    const body = route.request().postDataJSON();
    onOrder(body);
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          orderNumber: googleReview.order_id,
          total: 140,
          deposit: 0,
          remaining: 140,
          paymentMode: 'full',
          googleCustomerReview: googleReview,
        },
      }),
    });
  });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('seraj-cart', JSON.stringify([
      { slug: 'story-khaled', name: 'قصة خالد', price: 100, qty: 1 },
    ]));
    window.gapi = {
      load: function (module, callback) {
        window.__loadedGoogleModule = module;
        callback();
      },
      surveyoptin: {
        render: function (payload) {
          window.__capturedGoogleCustomerReview = payload;
        },
      },
    };
  });
});

test('submits buyer email and renders the Google opt-in only after order success', async ({ page }) => {
  let submittedOrder;
  await stubStorefront(page, body => { submittedOrder = body; });

  await page.goto('/#/checkout', { waitUntil: 'domcontentloaded' });
  await page.locator('#custName').fill('عميل سراج');
  await page.locator('#custPhone').fill('01123456789');
  await page.locator('#custEmail').fill('Buyer@Example.com');
  await page.locator('#custAddress').fill('القاهرة، المعادي');
  await page.locator('#submitOrderBtn').click();

  await expect(page).toHaveURL(/#\/success$/);
  await expect(page.locator('#orderNumDisplay')).toHaveText(googleReview.order_id);
  await page.waitForFunction(() => Boolean(window.__capturedGoogleCustomerReview));

  expect(submittedOrder.customerEmail).toBe('buyer@example.com');
  expect(await page.evaluate(() => window.__loadedGoogleModule)).toBe('surveyoptin');
  expect(await page.evaluate(() => window.__capturedGoogleCustomerReview)).toEqual({
    ...googleReview,
    opt_in_style: 'CENTER_DIALOG',
  });
  expect(await page.evaluate(() => localStorage.getItem('seraj-last-order'))).not.toContain('buyer@example.com');
});

test('blocks an invalid email before creating an order', async ({ page }) => {
  let orderRequests = 0;
  await stubStorefront(page, () => { orderRequests += 1; });

  await page.goto('/#/checkout', { waitUntil: 'domcontentloaded' });
  await page.locator('#custName').fill('عميل سراج');
  await page.locator('#custPhone').fill('01123456789');
  await page.locator('#custEmail').fill('not-an-email');
  await page.locator('#custAddress').fill('القاهرة، المعادي');
  await page.locator('#submitOrderBtn').click();

  await expect(page).toHaveURL(/#\/checkout$/);
  await expect(page.locator('#custEmail')).toHaveClass(/shake/);
  expect(orderRequests).toBe(0);
});

test('checkout remains free of horizontal overflow on supported mobile widths', async ({ page }) => {
  await stubStorefront(page, () => {});
  await page.goto('/#/checkout', { waitUntil: 'domcontentloaded' });

  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth, `width ${width}`).toBeLessThanOrEqual(dimensions.clientWidth);
  }
});
