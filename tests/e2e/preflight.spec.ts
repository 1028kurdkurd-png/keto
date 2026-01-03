import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const HOST = process.env.TEST_HOST || 'http://127.0.0.1:4173';

async function isRootVisible(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    const root = document.querySelector('#root') || document.querySelector('[data-root]') || document.body;
    if (!root) return false;
    const rect = root.getBoundingClientRect();
    const style = window.getComputedStyle(root);
    const htmlLen = (root.innerHTML || '').length;
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && htmlLen > 20;
  });
}

test.describe('preflight', () => {
  test('root visible or auto-fix resolves blank page', async ({ page }) => {
    page.on('console', (msg) => console.log('PAGE console>', msg.type(), msg.text()));
    page.on('pageerror', (err) => console.log('PAGE error>', err.message));
    await page.goto(HOST, { waitUntil: 'load', timeout: 45000 });

    let visible = await isRootVisible(page);
    if (visible) {
      expect(visible).toBeTruthy();
      return;
    }

    console.log('Root not visible — attempting auto-fix (if available)');
    const tried = await page.evaluate(() => {
      if (typeof (window as any).__runAutoFix === 'function') {
        try {
          (window as any).__runAutoFix(true);
          return true;
        } catch (e) { void e; return false; }
      }
      return false;
    });

    if (tried) {
      console.log('Auto-fix triggered; waiting for reload');
      // wait for navigation/reload
      try {
        await page.waitForLoadState('load', { timeout: 30000 });
      } catch (e) { void e; }

      visible = await isRootVisible(page);
      if (!visible) {
        const path = `tmp/preflight-failure-${Date.now()}.png`;
        await page.screenshot({ path, fullPage: true });
        console.log(`Saved failure screenshot: ${path}`);
      }

      expect(visible, 'Root must be visible after auto-fix attempt').toBeTruthy();
      return;
    }

    // No auto-fix available — capture diagnostics and fail
    const path = `tmp/preflight-no-autofix-${Date.now()}.png`;
    await page.screenshot({ path, fullPage: true });
    console.log(`Saved failure screenshot: ${path}`);
    throw new Error('Root not visible and auto-fix not available. See screenshot.');
  });
});
