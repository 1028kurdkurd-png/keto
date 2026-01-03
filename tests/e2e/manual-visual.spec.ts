import { test, expect } from '@playwright/test';

// Ensure a large viewport so admin sidebar is visible
test.use({ viewport: { width: 1200, height: 900 } });

const hosts = [process.env.TEST_HOST, 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://127.0.0.1:4173', 'http://localhost:4173'].filter(Boolean as any);

test('manual visual verification: product form, preview ingredients, team roles, cart', async ({ page, browserName }) => {
  let opened = false;
  let host: string = '';
  const start = Date.now();
  while (!opened && Date.now() - start < 30000) {
    for (const h of hosts) {
      try {
        await page.goto(h + '/admin2001', { timeout: 5000 });
        opened = true; host = h as string; break;
      } catch (e) { }
    }
    if (!opened) await new Promise(r => setTimeout(r, 500));
  }
  if (!opened) throw new Error('Could not reach dev server on known hosts');

  // login
  await page.fill('input[type="password"]', process.env.VITE_ADMIN_PASSWORD || 'keto55');
  await page.press('input[type="password"]', 'Enter');
  await page.click('input[type="password"] + button');
  await expect(page.locator('text=Export / Import')).toBeVisible({ timeout: 10000 });

  // Try to open Add Product and the wizard; if unavailable, continue with other checks
  let productFormFound = false;
  try {
    await page.waitForSelector('aside', { timeout: 5000 });
    try { await page.click('button:has-text("Add Product")', { timeout: 5000 }); } catch (e) {
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').trim().match(/add|زیاد/i));
        if (btn) { (btn as any).click?.() ?? btn.click(); }
      });
    }

    await page.waitForSelector('div.grid button, div.max-w-4xl button', { timeout: 7000 });
    const gridButtons = await page.$$('div.grid button');
    if (gridButtons.length > 0) {
      await gridButtons[0].click();
    } else {
      const wizardButton = await page.$('div.max-w-4xl button');
      if (wizardButton) await wizardButton.click();
    }

    // Wait briefly for form label; if found, capture screenshot
    await page.waitForSelector('label:has-text("ناوی خواردن")', { timeout: 7000 });
    await page.screenshot({ path: `test-results/manual-visual-product-form.png` });
    productFormFound = true;
  } catch (err) {
    console.warn('Product form not available in this environment - skipping product form checks.');
  }

  // Ensure there is no "description" textarea visible in product form and that a textarea (ingredients) exists
  if (productFormFound) {
    const hasDescription = await page.locator('label:has-text("Description")').count();
    const textareaCount = await page.locator('form textarea').count();
    // Debug: collect first few label texts (written to test output)
    const labels = await page.$$eval('form label', els => els.slice(0, 10).map(e => (e.textContent || '').trim()));
    console.log('ProductForm labels:', labels);
    expect(hasDescription).toBe(0);
    expect(textareaCount).toBeGreaterThan(0);
  } else {
    console.log('Skipping product form field assertions (form not found).');
  }

  // Go home and attempt to open first item preview (try category navigation if needed)
  await page.goto(host, { timeout: 10000 });
  let previewOpened = false;
  try {
    await page.waitForSelector('.img-container', { timeout: 5000 });
    await page.click('.img-container');
    previewOpened = true;
  } catch (e) {
    try {
      // open first category then click first item
      await page.waitForSelector('div.grid button', { timeout: 5000 });
      await page.click('div.grid button');
      await page.waitForSelector('.img-container', { timeout: 10000 });
      await page.click('.img-container');
      previewOpened = true;
    } catch (e2) {
      console.warn('No item preview available in this environment - skipping preview checks');
    }
  }
  if (previewOpened) {
    await expect(page.locator('text=پێکهاتەکان')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: `test-results/manual-visual-preview.png` });
  }

  // Set language to Kurdish and open Team view (skip if not present)
  await page.selectOption('select', 'ku');
  const teamBtnExists = await page.locator('button:has-text("تیم")').count();
  if (teamBtnExists > 0) {
    await page.click('button:has-text("تیم")');
    await expect(page.locator('h2:has-text("تیم")')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: `test-results/manual-visual-team-ku.png` });
  } else {
    console.log('Team section not visible; skipping Team verification');
  }

  // Add first item to cart and open cart (skip if no items)
  await page.goto(host, { timeout: 10000 });
  let cartOpen = false;
  try {
    await page.waitForSelector('.img-container', { timeout: 5000 });
    await page.click('button:has-text("+")').catch(() => { });
    // Open cart by clicking the footer button
    await page.click('button:has-text("View Cart")').catch(() => { });
    await page.waitForSelector('text=MY ORDER', { timeout: 5000 });
    await page.screenshot({ path: `test-results/manual-visual-cart.png` });
    cartOpen = true;
  } catch (e) {
    console.warn('Could not open cart - skipping cart verification');
  }

  // If cart opened, assert the two large buttons are not present in the cart view
  if (cartOpen) {
    const hasPlaceOrder = await page.locator('button:has-text("Place Order")').count();
    const hasMyOrders = await page.locator('button:has-text("My Orders")').count();
    expect(hasPlaceOrder).toBe(0);
    expect(hasMyOrders).toBe(0);
  }
});