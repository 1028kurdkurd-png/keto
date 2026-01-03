import { chromium } from 'playwright';
import fs from 'fs';
(async () => {
  const out = 'tmp/click-audit';
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1200, height: 900 }, recordVideo: { dir: out } });
  const page = await context.newPage();

  const audit = { clicks: [], console: [], errors: [] };

  page.on('console', msg => {
    const text = msg.text();
    audit.console.push({ type: msg.type(), text });
    // capture click-audit logs from page script
    if (text.startsWith('CLICK-AUDIT:')) {
      try { audit.clicks.push(JSON.parse(text.replace(/^CLICK-AUDIT:/, ''))); } catch (e) { }
    }
  });
  page.on('pageerror', err => { audit.errors.push({ message: err.message, stack: err.stack }); });

  page.on('response', response => {
    if (response.status() >= 400) {
      audit.console.push({ type: 'http-error', url: response.url(), status: response.status() });
    }
  });

  try {
    const hosts = [process.env.TEST_HOST || 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:4173', 'http://127.0.0.1:4173'];
    let opened = false;
    for (const h of hosts) {
      try {
        await page.goto(h, { waitUntil: 'domcontentloaded', timeout: 5000 });
        console.log('Opened', h);
        opened = true;
        break;
      } catch (e) {
        console.log('Could not open', h);
      }
    }
    if (!opened) throw new Error('Could not reach dev server');

    // Inject click auditor
    await page.addInitScript(() => {
      window.__clickAudit = [];
      document.addEventListener('click', function (e) {
        try {
          // avoid TS-only syntax in in-page script
          const t = e.target;
          const el = t && typeof t.tagName !== 'undefined' ? t : (t && t.parentElement) || null;
          const tag = el && (el.tagName || '') || '';
          const text = el && (el.innerText || '') ? String(el.innerText).slice(0, 200).trim() : '';
          const id = el && el.id ? el.id : null;
          const classes = el && el.className ? el.className : null;
          const info = { tag, text, id, classes, time: Date.now() };
          console.log('CLICK-AUDIT:' + JSON.stringify(info));
        } catch (err) { console.log('CLICK-AUDIT-ERR:' + String(err)); }
      }, true);
    });

    // Generic click flows to exercise the app
    // 1) Open home
    await page.goto(process.env.TEST_HOST || 'http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Click through main sections
    const selectors = [
      'button:has-text("View Cart")', // maybe not visible
      'button:has-text("تیم")',
      'button:has-text("Add Product")',
      '.img-container',
      'button:has-text("+" )',
      'button:has-text("Quick Test Export")',
      'button:has-text("Show Backups")'
    ];

    for (const sel of selectors) {
      try {
        const el = await page.$(sel);
        if (el) {
          await el.scrollIntoViewIfNeeded();
          await el.click({ timeout: 5000 });
          await page.waitForTimeout(700);
        }
      } catch (e) {
        // continue
      }
    }

    // Try admin flow explicitly
    try {
      await page.goto((process.env.TEST_HOST || 'http://localhost:3000') + '/admin2001', { waitUntil: 'domcontentloaded' });
      await page.fill('input[type="password"]', process.env.VITE_ADMIN_PASSWORD || 'keto55');
      await page.press('input[type="password"]', 'Enter');
      await page.waitForTimeout(500);
      // click Quick Test Export if present
      try { const q = await page.$('button:has-text("Quick Test Export")'); if (q) { await q.click(); await page.waitForTimeout(700); } } catch (e) { }
      try { const s = await page.$('button:has-text("Show Backups")'); if (s) { await s.click(); await page.waitForTimeout(700); } } catch (e) { }
    } catch (e) { console.log('Admin flow failed to open', String(e)); }

    // Wait a bit to let console messages arrive
    await page.waitForTimeout(1000);

    // Save audit
    fs.writeFileSync(out + '/audit.json', JSON.stringify(audit, null, 2));
    console.log('Audit saved to', out + '/audit.json');

    // Save page HTML for debugging
    const html = await page.content();
    fs.writeFileSync(out + '/page.html', html);

    // Close
    await context.close();
    await browser.close();
  } catch (err) {
    console.error('Click audit failed', err);
    try { fs.writeFileSync(out + '/audit.json', JSON.stringify(audit, null, 2)); } catch (e) { }
    process.exit(1);
  }
})();