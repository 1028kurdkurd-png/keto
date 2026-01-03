const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    // Prepare an error status in localStorage
    await page.goto('http://localhost:3000/admin2001');
    // Set a simulated error status in localStorage and reload so the UI picks it up
    await page.evaluate(() => {
      localStorage.setItem('mazen:autoBackup:status', JSON.stringify({ status: 'error', error: 'Simulated failure', timestamp: Date.now(), meta: { version: '1.0.0' } }));
    });
    await page.reload();
    await page.fill('input[type="password"]', process.env.VITE_ADMIN_PASSWORD || 'keto55');
    await page.press('input[type="password"]', 'Enter');
    await page.click('input[type="password"] + button');
    // Wait for Admin to show up
    await page.waitForSelector('text=Export / Import', { timeout: 10000 });

    // Expect the UI toast to be visible
    await page.waitForSelector('text=Auto-backup failed', { timeout: 5000 });
    console.log('Backup error toast visible — PASS');
  } catch (e) {
    console.error('Test failed', e);
    process.exit(1);
  } finally {
    await browser.close();
    process.exit(0);
  }
})();