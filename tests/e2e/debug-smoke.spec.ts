import { test } from '@playwright/test';

// Debug helper: visit the page, capture console events, print HTML and save screenshot

test('debug page load and capture console', async ({ page }) => {
  // Choose a reachable host: prefer TEST_HOST, then dev (3000), then preview (4173)
  async function isReachable(u: string) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(u, { method: 'HEAD', signal: controller.signal });
      clearTimeout(id);
      return !!res && res.status < 500;
    } catch (e) {
      return false;
    }
  }
  async function pickUrl() {
    const candidates: string[] = [];
    if (process.env.TEST_HOST) candidates.push(process.env.TEST_HOST);
    candidates.push('http://127.0.0.1:3000');
    candidates.push('http://127.0.0.1:4173');
    for (const c of candidates) {
      console.log('DEBUG: testing host', c);
      if (await isReachable(c)) return c;
    }
    return process.env.TEST_HOST || 'http://127.0.0.1:4173';
  }

  const url = await pickUrl();

  page.on('console', (msg) => {
    console.log(`CONSOLE (${msg.type()}): ${msg.text()}`);
  });

  page.on('pageerror', (err) => {
    console.log(`PAGE ERROR: ${err.message}`);
  });

  page.on('requestfailed', (req) => {
    const failure = req.failure();
    console.log(`REQUEST FAILED: ${req.method()} ${req.url()} ${failure?failure.errorText:''}`);
  });

  // Use load instead of networkidle to avoid hang from service workers or long-polling
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });

  // Capture basic DOM and service worker / cache / indexedDB state
  const html = await page.content();
  console.log('PAGE HTML LENGTH:', html.length);

  const rootInner = await page.locator('#root').innerHTML().catch(()=>'<no-root>');
  console.log('ROOT INNER LENGTH:', rootInner.length);

  const swInfo = await page.evaluate(async () => {
    const regs = 'serviceWorker' in navigator ? (await navigator.serviceWorker.getRegistrations()).map(r => ({ scope: r.scope, active: !!r.active, scriptURL: r.active && r.active.scriptURL })) : null;
    const cacheKeys = 'caches' in window ? await caches.keys() : null;
    const idb = ('indexedDB' in window && 'databases' in indexedDB) ? (await (indexedDB as any).databases()).map((d: any) => d.name) : null;
    return { regs, cacheKeys, idb };
  });
  console.log('SW INFO:', JSON.stringify(swInfo));

  await page.screenshot({ path: 'tmp/debug-before.png', fullPage: true });
});