import { test, expect } from '@playwright/test';

// Smoke test: ensure the app renders and no console errors during initial load

test('app renders without console errors', async ({ page }) => {
  const url = process.env.TEST_HOST || 'http://127.0.0.1:4173';

  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // networkidle can hang when SW keeps long-running connections open; use 'load' instead
  await page.goto(url, { waitUntil: 'load' });

  // Ensure root element exists and has content
  const root = page.locator('#root');
  await expect(root).toBeVisible({ timeout: 15000 });

  const html = await root.innerHTML();
  expect(html.length).toBeGreaterThan(10);

  // Take a screenshot for reporting
  await page.screenshot({ path: 'tmp/smoke-before.png', fullPage: true });

  // Fail if any console errors were captured
  expect(consoleErrors.length, 'console errors present').toBe(0);
});