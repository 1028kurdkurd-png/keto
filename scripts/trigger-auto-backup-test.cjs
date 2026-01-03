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

    // Wait a little for backup to complete (autosave is debounced)
    await page.waitForTimeout(8000);

    // Evaluate local storage for latest auto backup and status
    const backups = await page.evaluate(async () => {
      try {
        const raw = localStorage.getItem('mazen:latestAutoBackup') || localStorage.getItem('local_backups');
        const statusRaw = localStorage.getItem('mazen:autoBackup:status');
        const status = statusRaw ? JSON.parse(statusRaw) : null;
        let parsed = null;
        if (raw) {
          try { parsed = JSON.parse(raw); } catch (e) { parsed = raw; }
        }
        return { found: !!raw, meta: parsed?.meta || null, status };
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
