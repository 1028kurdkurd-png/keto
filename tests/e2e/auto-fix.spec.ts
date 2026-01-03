import { test, expect } from '@playwright/test';

const HOST = process.env.TEST_HOST || 'http://127.0.0.1:4173';

test('Retry button triggers auto-fix and records telemetry', async ({ page }) => {
  await page.goto(HOST, { waitUntil: 'load', timeout: 45000 });

  // Ensure clean telemetry
  await page.evaluate(() => { try { localStorage.removeItem('sw_auto_fix_attempts'); localStorage.removeItem('sw_auto_fix_done'); } catch (e) { void e; } });

  // Ensure banner is not present yet
  expect(await page.$('#auto-fix-banner')).toBeNull();

  // Expose a spy for __runAutoFix
  await page.evaluate(() => {
    (window as any).__runAutoFix = async function() {
      (window as any).__runAutoFix_called = (window as any).__runAutoFix_called ? (window as any).__runAutoFix_called + 1 : 1;
      return true;
    };
  });

  // Show the banner via exposed helper
  await page.evaluate(() => {
    if (typeof (window as any).__showAutoFixBanner === 'function') {
      (window as any).__showAutoFixBanner();
    } else {
      throw new Error('__showAutoFixBanner not available');
    }
  });

  // Verify banner and buttons exist
  const banner = await page.$('#auto-fix-banner');
  expect(banner).not.toBeNull();
  const retry = await page.$('#auto-fix-retry');
  expect(retry).not.toBeNull();

  // Click the retry button
  await retry!.click();

  // Wait a short while for the handler
  await page.waitForTimeout(200);

  // Verify the spy was invoked and telemetry recorded
  const called = await page.evaluate(() => (window as any).__runAutoFix_called || 0);
  expect(called).toBeGreaterThan(0);
  const attempts = await page.evaluate(() => localStorage.getItem('sw_auto_fix_attempts'));
  expect(attempts).toBe('1');
});