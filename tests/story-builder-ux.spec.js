/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const { test, expect } = require('@playwright/test');

async function stubStoreApis(page, promotion = null, testimonials = []) {
  await page.route('**/api/products', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data: [] }),
  }));
  await page.route('**/api/config', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data: {} }),
  }));
  await page.route('**/api/content', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data: {} }),
  }));
  await page.route('**/api/testimonials', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data: testimonials }),
  }));
  await page.route('**/api/promotions/active', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data: promotion }),
  }));
}

async function revealPromotionByScrolling(page) {
  const modal = page.locator('#promoModal');
  await expect.poll(async () => {
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
      window.dispatchEvent(new Event('scroll'));
    });
    return modal.isVisible();
  }).toBe(true);
  return modal;
}

test('customer completes the personalized story steps and reviews the saved details', async ({ page }) => {
  test.setTimeout(60000);
  await stubStoreApis(page);
  await page.route('**/api/upload-child-photo', route => route.fulfill({
    status: 201,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data: { url: 'https://example.com/child.webp' } }),
  }));
  await page.goto('http://127.0.0.1:3000/#/wizard', { waitUntil: 'domcontentloaded' });

  await page.locator('#heroName').fill('ليلى');
  await page.locator('[data-age="6"]').click();
  await page.locator('[data-gender="girl"]').click();
  await page.locator('.wizard-step[data-step="1"] [data-next]').click();
  await expect(page.locator('#wizStepLabel')).toContainText('القيمة');

  await page.locator('.challenge-card').first().click();
  await page.locator('.wizard-step[data-step="2"] [data-next]').click();
  await expect(page.locator('#photoGuideTitle')).toBeVisible();

  await page.locator('#photoInput').setInputFiles(path.join(process.cwd(), 'public/assets/seraj.webp'));
  const photoContinue = page.locator('.wizard-step[data-step="3"] [data-next]');
  await expect(photoContinue).toBeVisible();
  await photoContinue.click();
  await expect(page.locator('#wizStepLabel')).toContainText('اللمسة الأخيرة');

  await page.locator('[data-dedication="warm"]').click();
  await page.locator('[data-recipient-type="other"]').click();
  await page.locator('.wizard-step[data-step="4"] [data-next]').click();
  await expect(page).toHaveURL(/#\/wizard$/);
  await expect(page.locator('#recipientName')).toBeFocused();
  await page.locator('#recipientName').fill('منى أحمد');
  await page.locator('#recipientPhone').fill('01012345678');
  await page.locator('#recipientAddress').fill('القاهرة، مدينة نصر، شارع الطيران');
  await page.locator('.wizard-step[data-step="4"] [data-next]').click();
  await expect(page).toHaveURL(/#\/preview$/, { timeout: 10000 });
  await expect(page.locator('#storyReview')).toContainText('ليلى');
  await expect(page.locator('#storyReview')).toContainText('بطلة');
  await expect(page.locator('#storyReview')).toContainText('إهداء');
  await expect(page.locator('#storyReview')).toContainText('منى أحمد');
  await expect(page.locator('#storyReview')).toContainText('01012345678');
});

test('photo upload server failure returns the customer to the photo step with a useful message', async ({ page }) => {
  await stubStoreApis(page);
  await page.route('**/api/upload-child-photo', route => route.fulfill({
    status: 500,
    contentType: 'text/html',
    body: '<html><body>Server error</body></html>',
  }));
  await page.addInitScript(() => {
    localStorage.setItem('seraj-wizard', JSON.stringify({
      heroName: 'سلمى',
      age: 6,
      gender: 'girl',
      challenge: 'شجاعة',
      language: 'ar',
      dedicationType: 'none',
      deliveryRecipientType: 'customer',
      photoUrls: [],
      wizardStep: 3,
    }));
  });
  await page.goto('http://127.0.0.1:3000/#/wizard', { waitUntil: 'domcontentloaded' });
  await page.locator('#photoInput').setInputFiles(path.join(process.cwd(), 'public/assets/seraj.webp'));
  await page.locator('.wizard-step[data-step="3"] [data-next]').click();
  await page.locator('.wizard-step[data-step="4"] [data-next]').click();

  await expect(page.locator('#photoGuideTitle')).toBeVisible();
  await expect(page.locator('#gsdToast')).toContainText('تعذر رفع الصورة الآن');
});

test('featured promotion is saved before the customer enters the story builder', async ({ page }) => {
  await stubStoreApis(page, {
    code: 'SERAJ10',
    offerText: 'خصم 10%',
    headline: 'هدية ترحيبية من سراج',
    message: 'ابدئي أول حكاية بخصم مميز.',
    ctaText: 'فعّلي الخصم وابدئي القصة',
    validTo: '2030-09-15T23:59:59.000Z',
  });
  const promotionResponse = page.waitForResponse('**/api/promotions/active');
  await page.goto('http://127.0.0.1:3000/#/home', { waitUntil: 'domcontentloaded' });
  await promotionResponse;
  await revealPromotionByScrolling(page);
  await page.locator('#promoCta').click();
  await expect(page).toHaveURL(/#\/wizard$/);
  await expect(page.locator('#wizardPromoChip')).toContainText('SERAJ10');
  await expect(page.evaluate(() => localStorage.getItem('seraj-promo-code'))).resolves.toBe('SERAJ10');
});

for (const closeMethod of ['button', 'backdrop', 'escape']) {
  test(`featured promotion closes by ${closeMethod}`, async ({ page }) => {
    await stubStoreApis(page, {
      code: 'SERAJ10',
      offerText: 'خصم 10%',
      headline: 'عرض ترحيبي من سراج',
      message: 'ابدئي أول حكاية بخصم مميز.',
      ctaText: 'فعّلي الخصم وابدئي القصة',
      validTo: null,
    });
    const promotionResponse = page.waitForResponse('**/api/promotions/active');
    await page.goto('http://127.0.0.1:3000/#/home', { waitUntil: 'domcontentloaded' });
    await promotionResponse;
    const modal = await revealPromotionByScrolling(page);
    if (closeMethod === 'button') await modal.locator('.promo-close').click();
    if (closeMethod === 'backdrop') await modal.click({ position: { x: 5, y: 5 } });
    if (closeMethod === 'escape') await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });
}

test('WhatsApp testimonial screenshots render with their accessible description', async ({ page }) => {
  await stubStoreApis(page, null, [{
    name: 'عميلة سراج',
    quote: '',
    location: '',
    childAge: '',
    avatarInitials: 'س',
    avatarColor: '#6bbf3f',
    screenshotUrl: '/assets/share-banner.webp',
    screenshotAlt: 'رسالة واتساب تشكر سراج على القصة',
  }]);
  await page.goto('http://127.0.0.1:3000/#/home', { waitUntil: 'domcontentloaded' });

  const screenshot = page.locator('.testimonial-media-card img');
  await expect(screenshot).toBeVisible();
  await expect(screenshot).toHaveAttribute('alt', 'رسالة واتساب تشكر سراج على القصة');
});

for (const width of [320, 360, 390, 430]) {
  test(`story builder has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await stubStoreApis(page);
    await page.addInitScript(() => {
      localStorage.setItem('seraj-wizard', JSON.stringify({
        heroName: 'سلمى',
        age: 6,
        gender: 'girl',
        challenge: 'شجاعة',
        language: 'ar',
        dedicationType: 'none',
        deliveryRecipientType: 'customer',
        photoUrls: ['https://example.com/child.webp'],
        wizardStep: 3,
      }));
    });
    await page.goto('http://127.0.0.1:3000/#/wizard', { waitUntil: 'domcontentloaded' });

    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);

    await page.locator('.wizard-step[data-step="3"] [data-next]').click();
    await page.locator('[data-recipient-type="other"]').click();
    await expect(page.locator('#recipientFields')).toBeVisible();
    const recipientDimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(recipientDimensions.document).toBeLessThanOrEqual(recipientDimensions.viewport);
  });
}
