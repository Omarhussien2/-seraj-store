/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require('@playwright/test');

test.describe('Coloring Features', () => {
  test('renders catalog, builds workbook, and sends it to checkout', async ({ page }) => {
    test.setTimeout(90000);

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    await page.route('**/api/products', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });
    await page.route('**/api/config', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} }),
      });
    });
    await page.route('**/api/group-buys/config', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { active: false } }),
      });
    });
    await page.route('**/api/coloring/categories', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { slug: 'heroes', nameAr: 'Heroes' },
            { slug: 'animals', nameAr: 'Animals' },
          ],
        }),
      });
    });
    await page.route('**/api/coloring/pricing', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { pricePerPage: 3, coverPrice: 20 } }),
      });
    });
    await page.route('**/api/coloring/items?**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { _id: 'c1', title: 'Seraj Reads', thumbnail: 'assets/seraj.png' },
            { _id: 'c2', title: 'Brave Khaled', thumbnail: 'assets/khaled-v2.png' },
            { _id: 'c3', title: 'Layla Draws', thumbnail: 'assets/layla.png' },
            { _id: 'c4', title: 'Zain Plays', thumbnail: 'assets/zain.png' },
            { _id: 'c5', title: 'Huda Flies', thumbnail: 'assets/huda-bird.png' },
          ],
          pagination: { page: 1, pages: 1 },
        }),
      });
    });

    await page.goto('http://127.0.0.1:3000/#/mama-coloring', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/سراج \| أنشطة وتلوين مجاني/);
    await expect(page.locator('.page.is-active')).toHaveAttribute('data-page', 'mama-world');

    const categoryTabs = page.locator('#coloringTabs .chip');
    await expect(categoryTabs.first()).toBeVisible({ timeout: 10000 });
    await expect(categoryTabs).toHaveCount(3);

    const cards = page.locator('.coloring-card');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    await expect(cards).toHaveCount(5);

    const workbookBar = page.locator('#coloringWorkbookBar');
    const firstAddButton = cards.first().locator('.coloring-btn-add');
    await firstAddButton.click();
    await expect(firstAddButton).toHaveClass(/is-added/);
    await expect(workbookBar).toBeVisible();
    await expect(workbookBar.locator('#cwbCount')).toHaveText('١');

    for (let i = 1; i < 5; i += 1) {
      await cards.nth(i).locator('.coloring-btn-add').click();
    }
    await expect(workbookBar.locator('#cwbCount')).toHaveText('٥');

    await workbookBar.locator('#cwbBtn').click();
    await expect(page).toHaveURL(/#\/coloring-book/);

    const summaryPanel = page.locator('.cb-summary-panel');
    await expect(summaryPanel).toBeVisible({ timeout: 5000 });

    const checkoutButton = page.locator('#btnColoringCheckout');
    await expect(checkoutButton).toBeEnabled();
    await checkoutButton.click();

    await expect(page).toHaveURL(/#\/cart/);
  });
});
