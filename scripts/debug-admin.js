import { chromium } from 'playwright';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));
  const url = process.argv[2] || 'http://127.0.0.1:4173/admin2001';
  console.log('Opening', url);
  await page.goto(url, { timeout: 10000 });
  console.log('PAGE TITLE:', await page.title());
  const hasPassword = await page.$('input[type="password"]');
  console.log('Has password input?', !!hasPassword);
  if (hasPassword) {
    const password = process.env.VITE_ADMIN_PASSWORD || 'keto55';
    await page.fill('input[type="password"]', password);
    await page.press('input[type="password"]', 'Enter');
    await page.waitForTimeout(1500);
  }
  const body = await page.content();
  console.log('BODY LENGTH:', body.length);
  // dump small snippet
  console.log('BODY SNIPPET:', body.slice(0, 1200));
  await browser.close();
})();