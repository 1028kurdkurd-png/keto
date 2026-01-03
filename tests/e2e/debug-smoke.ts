import { test } from '@playwright/test';

// Debug helper: visit the page, capture console events, print HTML and save screenshot

test('debug page load and capture console', async ({ page }) => {
  const url = process.env.TEST_HOST || 'http://127.0.0.1:4173';

  page.on('console', (msg) => {
    console.log(`CONSOLE (${msg.type()}): ${msg.text()}`);
  });

  page.on('pageerror', (err) => {
    console.log(`PAGE ERROR: ${err.message}`);
  });

  // Use load instead of networkidle to avoid hang from service workers or long-polling
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });

  const html = await page.content();
  console.log('PAGE HTML LENGTH:', html.length);

  await page.screenshot({ path: 'tmp/debug-before.png', fullPage: true });
});