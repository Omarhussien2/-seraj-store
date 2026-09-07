/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require('@playwright/test');

const googleLoader = `
  (function () {
    var queued = (window.dataLayer || []).slice();
    window.gtag = function () {
      var args = Array.prototype.slice.call(arguments);
      window.dataLayer.push(args);
      if (args[0] === 'get') {
        args[3](args[2] === 'client_id' ? '123.456' : '789');
      }
      if (args[0] === 'event') {
        fetch('https://www.google-analytics.com/g/collect?en=' + encodeURIComponent(args[1]));
      }
    };
    queued.forEach(function (args) { window.gtag.apply(null, args); });
  }());
`;

function isAnalyticsRequest(url) {
  return url.includes('googletagmanager.com/gtag/js') || url.includes('google-analytics.com/');
}

async function consentEvents(page) {
  return page.evaluate(() => (window.dataLayer || [])
    .map(entry => Array.from(entry))
    .filter(entry => entry[0] === 'consent'));
}

async function trackedEvents(page) {
  return page.evaluate(() => (window.dataLayer || [])
    .map(entry => Array.from(entry))
    .filter(entry => entry[0] === 'event'));
}

test.describe('consent-aware conversion tracking', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept all third-party traffic; no test reaches a live collector.
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1'
      ? route.continue() : route.abort());
    await page.route('**/www.googletagmanager.com/gtag/js**', route => route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: googleLoader,
    }));
    await page.route('**/*google-analytics.com/**', route => route.fulfill({ status: 204 }));
    await page.route('**/api/**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    }));
  });

  test('absence and explicit rejection produce zero analytics network traffic', async ({ page }) => {
    const analyticsRequests = [];
    page.on('request', request => {
      if (isAnalyticsRequest(request.url())) analyticsRequests.push(request.url());
    });

    await page.goto('/#/home');
    expect(analyticsRequests).toHaveLength(0);
    await page.getByRole('button', { name: 'لا أوافق', exact: true }).click();
    await page.evaluate(() => {
      location.hash = '#/checkout';
      window.SerajAnalytics.trackCheckout();
    });

    expect(analyticsRequests).toHaveLength(0);
    expect((await trackedEvents(page)).filter(entry => entry[1] === 'purchase')).toHaveLength(0);
  });

  test('accept loads once and page_location keeps only bounded srsltid attribution', async ({ page }) => {
    const loaderRequests = [];
    page.on('request', request => {
      if (request.url().includes('googletagmanager.com/gtag/js')) loaderRequests.push(request.url());
    });

    await page.goto('/?srsltid=AbC_123-xy&phone=01000000000#/product/custom-story?child=PRIVATE');
    await page.getByRole('button', { name: 'أوافق', exact: true }).click();
    await expect.poll(() => loaderRequests.length).toBe(1);

    const pageViews = (await trackedEvents(page)).filter(entry => entry[1] === 'page_view');
    expect(JSON.stringify(pageViews)).toContain('srsltid=AbC_123-xy');
    expect(JSON.stringify(pageViews)).not.toContain('01000000000');
    expect(JSON.stringify(pageViews)).not.toContain('custom-story');
    expect(JSON.stringify(pageViews)).not.toContain('PRIVATE');
    expect(JSON.stringify(pageViews)).not.toContain(await page.title());
  });

  test('revoke stops events and reaccept grants consent without loading twice', async ({ page }) => {
    const loaderRequests = [];
    page.on('request', request => {
      if (request.url().includes('googletagmanager.com/gtag/js')) loaderRequests.push(request.url());
    });
    const withdrawals = [];
    await page.route('**/api/analytics/consent', async route => {
      withdrawals.push(route.request().postDataJSON());
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ success: true }) });
    });
    await page.goto('/#/home');
    await page.getByRole('button', { name: 'أوافق', exact: true }).click();
    await expect.poll(() => loaderRequests.length).toBe(1);
    const firstAttribution = await page.evaluate(() => window.SerajAnalytics.getAttribution());

    await page.getByRole('button', { name: 'الخصوصية', exact: true }).click();
    await page.getByRole('button', { name: 'لا أوافق', exact: true }).click();
    await expect.poll(() => withdrawals.length).toBe(1);
    expect(withdrawals[0]).toEqual({ tokens: [firstAttribution.consentToken] });
    const beforeRevokedEvent = (await trackedEvents(page)).length;
    await page.evaluate(() => window.SerajAnalytics.trackCheckout());
    expect((await trackedEvents(page))).toHaveLength(beforeRevokedEvent);

    await page.getByRole('button', { name: 'الخصوصية', exact: true }).click();
    await page.getByRole('button', { name: 'أوافق', exact: true }).click();
    const secondAttribution = await page.evaluate(() => window.SerajAnalytics.getAttribution());
    expect(secondAttribution.consentToken).not.toBe(firstAttribution.consentToken);
    const updates = (await consentEvents(page)).filter(entry => entry[1] === 'update');
    expect(updates.at(-1)[2].analytics_storage).toBe('granted');
    expect(loaderRequests).toHaveLength(1);
    await page.getByRole('button', { name: 'الخصوصية', exact: true }).click();
    await expect(page.locator('[data-consent-banner]')).toContainText('معرّفات عميل وجلسة مستعارة');
    await expect(page.locator('[data-consent-banner]')).toContainText('لا يمكن استرجاع بيانات أُرسلت بالفعل');
    await page.keyboard.press('Escape');
  });

  test('failed withdrawal remains queued and retries after reload until acknowledged', async ({ page }) => {
    let attempts = 0;
    await page.route('**/api/analytics/consent', async route => {
      attempts += 1;
      await route.fulfill({ status: attempts === 1 ? 503 : 200,
        contentType: 'application/json', body: JSON.stringify({ success: attempts > 1 }) });
    });
    await page.goto('/#/home');
    await page.getByRole('button', { name: 'أوافق', exact: true }).click();
    const attribution = await page.evaluate(() => window.SerajAnalytics.getAttribution());
    await page.getByRole('button', { name: 'الخصوصية', exact: true }).click();
    await page.getByRole('button', { name: 'لا أوافق', exact: true }).click();
    await expect.poll(() => attempts).toBe(1);

    await page.reload();
    await expect.poll(() => attempts).toBe(2);
    const receipts = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('seraj-analytics-withdrawals-v1') || '[]'));
    expect(receipts).not.toContain(attribution.consentToken);
  });

  test('durable-token storage failure omits server attribution without blocking consent', async ({ page }) => {
    await page.addInitScript(() => {
      const setItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === 'seraj-analytics-token-v1') throw new DOMException('blocked', 'QuotaExceededError');
        return setItem.call(this, key, value);
      };
    });
    await page.goto('/#/home');
    await page.getByRole('button', { name: 'أوافق', exact: true }).click();

    expect(await page.evaluate(() => window.SerajAnalytics.getAttribution())).toBeUndefined();
  });

  test('denied retained token retries after queue failure without reacceptance', async ({ page }) => {
    const withdrawals = [];
    await page.route('**/api/analytics/consent', async route => {
      withdrawals.push(route.request().postDataJSON());
      await route.fulfill({ status: withdrawals.length === 1 ? 503 : 200,
        contentType: 'application/json', body: JSON.stringify({ success: withdrawals.length > 1 }) });
    });
    await page.goto('/#/home');
    await page.getByRole('button', { name: 'أوافق', exact: true }).click();
    const firstAttribution = await page.evaluate(() => window.SerajAnalytics.getAttribution());
    await page.evaluate(() => {
      const setItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === 'seraj-analytics-withdrawals-v1') throw new DOMException('blocked', 'QuotaExceededError');
        return setItem.call(this, key, value);
      };
    });
    await page.getByRole('button', { name: 'الخصوصية', exact: true }).click();
    await page.getByRole('button', { name: 'لا أوافق', exact: true }).click();
    await expect.poll(() => withdrawals.length).toBe(1);
    expect(firstAttribution.consentToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    await page.reload();
    await expect.poll(() => withdrawals.length).toBe(2);
    expect(withdrawals[1]).toEqual({ tokens: [firstAttribution.consentToken] });
    expect(await page.evaluate(() => window.SerajAnalytics.getAttribution())).toBeUndefined();
    expect(await page.evaluate(() => localStorage.getItem('seraj-analytics-token-v1'))).toBeNull();
  });

  test('clearing shared storage denies tracking in another open document', async ({ page }) => {
    await page.goto('/#/home');
    await page.getByRole('button', { name: 'أوافق', exact: true }).click();
    await page.evaluate(() => window.dispatchEvent(new StorageEvent('storage', { key: null })));

    expect(await page.evaluate(() => window.SerajAnalytics.getAttribution())).toBeUndefined();
    expect(await page.evaluate(() => window['ga-disable-G-FZW3R2J7Y9'])).toBe(true);
  });

  test('attribution is real, order summary is SKU-only, and repeat submission is suppressed', async ({ page }) => {
    await page.goto('/#/home');
    await page.getByRole('button', { name: 'أوافق', exact: true }).click();
    const attribution = await page.evaluate(() => window.SerajAnalytics.getAttribution());
    expect(attribution).toMatchObject({ consent: true, clientId: '123.456', sessionId: '789' });
    expect(attribution.consentToken).toMatch(/^[A-Za-z0-9_-]{43}$/);

    await page.evaluate(() => {
      const summary = {
        transactionId: 'SRJ-2026-0042',
        value: 180,
        shipping: 40,
        currency: 'EGP',
        items: [{ itemId: 'trusted-sku', itemName: 'PRIVATE NAME', price: 90, quantity: 2 }],
      };
      window.SerajAnalytics.trackOrderSubmitted(summary);
      window.SerajAnalytics.trackOrderSubmitted(summary);
    });
    const submissions = (await trackedEvents(page)).filter(entry => entry[1] === 'order_submitted');
    expect(submissions).toHaveLength(1);
    expect(JSON.stringify(submissions)).toContain('trusted-sku');
    expect(JSON.stringify(submissions)).not.toContain('PRIVATE NAME');
    expect((await trackedEvents(page)).filter(entry => entry[1] === 'purchase')).toHaveLength(0);
  });

  test('public-to-admin navigation blocks sends and attribution reads', async ({ page }) => {
    await page.goto('/about');
    await page.getByRole('button', { name: 'أوافق', exact: true }).click();
    await page.evaluate(() => history.pushState({}, '', '/admin/orders/private-token'));
    const eventCount = (await trackedEvents(page)).length;
    const attribution = await page.evaluate(async () => {
      window.SerajAnalytics.trackCheckout();
      return window.SerajAnalytics.getAttribution();
    });

    expect(attribution).toBeUndefined();
    expect(await trackedEvents(page)).toHaveLength(eventCount);
  });

  test('consent controls have no horizontal overflow at supported mobile widths', async ({ page }) => {
    await page.goto('/#/home');
    for (const width of [320, 360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth, `width ${width}`).toBeLessThanOrEqual(dimensions.clientWidth);
    }
    await page.setViewportSize({ width: 320, height: 568 });
    const banner = page.locator('[data-consent-banner]');
    await expect(banner).toBeVisible();
    expect((await banner.boundingBox()).y).toBeGreaterThanOrEqual(0);
    for (const name of ['أوافق', 'لا أوافق']) {
      const button = page.getByRole('button', { name, exact: true });
      await button.scrollIntoViewIfNeeded();
      await expect(button).toBeVisible();
    }
    await page.screenshot({ path: test.info().outputPath('consent-mobile.png') });
  });

  test('blocked Google cannot hold up a real checkout submission', async ({ page }) => {
    await page.route('**/www.googletagmanager.com/gtag/js**', route => route.fulfill({
      status: 200, contentType: 'application/javascript', body: '',
    }));
    await page.addInitScript(() => localStorage.setItem('seraj-cart', JSON.stringify([
      { slug: 'story-khaled', name: 'قصة خالد', price: 100, qty: 1 },
    ])));
    let submittedOrder;
    await page.route('**/api/orders', async route => {
      submittedOrder = route.request().postDataJSON();
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({
        success: true, data: { orderNumber: 'SRJ-2026-9001', total: 140, deposit: 0,
          remaining: 140, paymentMode: 'full', analyticsSummary: { transactionId: 'SRJ-2026-9001',
            value: 100, shipping: 40, items: [{ itemId: 'story-khaled', price: 100, quantity: 1 }] } },
      }) });
    });
    await page.goto('/#/checkout');
    await page.getByRole('button', { name: 'الخصوصية', exact: true }).click();
    await page.getByRole('button', { name: 'أوافق', exact: true }).click();
    await page.locator('#custName').fill('عميل اختبار');
    await page.locator('#custPhone').fill('01123456789');
    await page.locator('#custEmail').fill('local-test@example.com');
    await page.locator('#custAddress').fill('عنوان اختبار محلي');
    await page.locator('#submitOrderBtn').click();
    await expect(page).toHaveURL(/#\/success$/, { timeout: 6000 });
    expect(submittedOrder.analyticsAttribution).toBeUndefined();
    const events = await trackedEvents(page);
    expect(events.filter(entry => entry[1] === 'order_submitted')).toHaveLength(1);
    expect(events.filter(entry => entry[1] === 'purchase')).toHaveLength(0);
    expect(JSON.stringify(events)).not.toMatch(/01123456789|local-test@example|عنوان اختبار/);
  });

  test('denial persists across reload and Escape closes without granting consent', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'لا أوافق', exact: true }).click();
    await page.reload();
    await expect(page.locator('[data-consent-banner]')).toHaveCount(0);
    await page.getByRole('button', { name: 'الخصوصية', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-consent-banner]')).toHaveCount(0);
    expect(await page.evaluate(() => window.SerajAnalytics.getAttribution())).toBeUndefined();
  });

  test('retry endpoint rejects anonymous callers before accessing orders', async ({ request }) => {
    const response = await request.post('/api/admin/analytics/retry');
    expect(response.status()).toBe(401);
  });
});
