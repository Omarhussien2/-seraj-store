const { test, expect } = require('@playwright/test');

test.describe('Coloring Features', () => {
  test('Coloring Catalog rendering and interactivity', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
    
    await page.goto('http://localhost:3000/#/mama-coloring', { waitUntil: 'load' });
    
    // We expect the page title to change
    await expect(page).toHaveTitle(/سراج | كشكول ألوان/);

    // Categories tabs should load
    const categoryTabs = page.locator('#coloringTabs .chip');
    await expect(categoryTabs.first()).toBeVisible({ timeout: 5000 });

    // Ensure there's a "All Categories" or similar button and verify count
    const tabsCount = await categoryTabs.count();
    expect(tabsCount).toBeGreaterThan(0);

    // Wait for coloring grid to load items
    const cards = page.locator('.coloring-card');
    await expect(cards.first()).toBeVisible({ timeout: 5000 });

    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);

    console.log(`Found ${tabsCount} categories and ${cardCount} cards`);

    // Let's add the first item to the cart
    const firstAddBtn = cards.first().locator('.coloring-action-btn');
    const firstTitle = await cards.first().locator('.coloring-title').innerText();
    await firstAddBtn.click();
    
    // Check if the button changed to 'متضافة' (Added)
    await expect(firstAddBtn).toHaveClass(/is-added/);

    // Check if the floating workbook button appears
    const fabButton = page.locator('#floatingWorkbookBtn');
    await expect(fabButton).toBeVisible();
    await expect(fabButton.locator('#fwbCount')).toHaveText('١'); // Arabic '1'
    
    // Let's click another item to verify counter goes up
    if (cardCount > 1) {
       await cards.nth(1).locator('.coloring-action-btn').click();
       await expect(fabButton.locator('#fwbCount')).toHaveText('٢'); // Arabic '2'
       console.log('Successfully added 2 items to workbook');
    }

    // Now go to the workbook checkout
    await fabButton.click();
    
    // We should be on the coloring-book page now!
    await expect(page).toHaveURL(/#\/coloring-book/);

    const summaryPanel = page.locator('.cb-summary-panel');
    await expect(summaryPanel).toBeVisible({ timeout: 2000 });
    
    const summaryText = await summaryPanel.innerText();
    console.log('Summary Details:\n', summaryText);

    // Click checkout
    const checkoutBtn = page.locator('#btnColoringCheckout');
    await checkoutBtn.click();

    // Verify redirects to main cart/checkout
    await expect(page).toHaveURL(/#\/checkout/);
  });
});
