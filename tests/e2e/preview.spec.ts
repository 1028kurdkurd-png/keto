import { test, expect } from '@playwright/test';

// NOTE: Start server before running these tests: `node scripts/serve_dist.cjs` (port 4173)

test.describe('Preview smoke', () => {
  test('homepage loads and has root container', async ({ page }) => {
    await page.goto('http://localhost:4173');
    await expect(page).toHaveURL(/localhost:4173/);
    await expect(page.locator('#root')).toBeVisible();
  });

  test('assets are referenced', async ({ page }) => {
    await page.goto('http://localhost:4173');
    // Check that the main JS bundle is referenced in HTML
    const html = await page.content();
    expect(html).toContain('/assets/index-');
  });
});
