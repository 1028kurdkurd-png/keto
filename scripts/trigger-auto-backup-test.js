const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    await page.goto('http://localhost:3000/admin2001');
    await page.fill('input[type="password"]', process.env.VITE_ADMIN_PASSWORD || 'keto55');
    await page.press('input[type="password"]', 'Enter');
    await page.click('input[type="password"] + button');
    await page.waitForSelector('text=Export / Import', { timeout: 10000 });
    // Click 'Run backup now' button
    await page.click('button:has-text("Run backup now")');

    // Wait a little for backup to complete
    await page.waitForTimeout(6000);

    // Evaluate local storage for latest auto backup
    const backups = await page.evaluate(async () => {
      try {
        const raw = localStorage.getItem('mazen:latestAutoBackup') || localStorage.getItem('local_backups');
        if (!raw) return { found: false };
        try {
          const parsed = JSON.parse(raw);
          return { found: true, meta: parsed.meta || parsed[0]?.meta || null };
        } catch (e) { return { found: true, raw }; }
      } catch (e) { return { error: String(e) } }
    });
    console.log('Backups:', backups);
  } catch (e) {
    console.error('Test failed', e);
  } finally {
    await browser.close();
    process.exit(0);
  }
})();
