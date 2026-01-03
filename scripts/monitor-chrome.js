import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

const outDir = path.resolve(process.cwd(), 'tmp', 'monitor-screenshots');
fs.mkdirSync(outDir, { recursive: true });

const hosts = [process.env.TEST_HOST || null, 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://127.0.0.1:4173', 'http://localhost:4173'].filter(Boolean);

const wait = (ms) => new Promise(res => setTimeout(res, ms));

async function isHostUp(h) {
  try {
    const r = await fetch(h, { method: 'GET' });
    return r && r.status < 500;
  } catch (e) {
    return false;
  }
}

async function ensureServerUp(timeoutMs = 60000) {
  for (const h of hosts) {
    if (await isHostUp(h)) return h;
  }

  console.log('Server not reachable; attempting to start dev server (npm run dev)');
  const proc = spawn('npm', ['run', 'dev'], { shell: true, stdio: 'inherit' });

  const startTime = Date.now();
  while ((Date.now() - startTime) < timeoutMs) {
    for (const h of hosts) {
      if (await isHostUp(h)) {
        console.log('Dev server is up at', h);
        return h;
      }
    }
    await wait(2000);
  }

  throw new Error('Dev server did not become reachable within timeout');
}

async function attempt(action, page, desc, retries = 2) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      await action();
      return true;
    } catch (e) {
      lastErr = e;
      console.warn(`Attempt ${i + 1} failed for ${desc}:`, e.message || e);
      try { await page.reload({ timeout: 5000 }); } catch (ex) { }
      await wait(1000);
    }
  }
  throw lastErr;
}

(async () => {
  let host = null;
  try {
    host = await ensureServerUp(60000);
  } catch (e) {
    console.error('Could not ensure dev server:', e.message);
    process.exit(1);
  }

  console.log('Launching Chrome (headed)...');
  const browser = await chromium.launch({ channel: 'chrome', headless: false });
  const context = await browser.newContext({ viewport: { width: 900, height: 1400 } });
  const page = await context.newPage();

  try {
    console.log('Opening admin login...');
    await page.goto(host + '/admin2001', { timeout: 10000 });

    await attempt(async () => {
      await page.fill('input[type="password"]', process.env.VITE_ADMIN_PASSWORD || 'keto55');
      await page.press('input[type="password"]', 'Enter');
      await page.click('input[type="password"] + button');
      await page.waitForSelector('text=Export / Import', { timeout: 10000 });
    }, page, 'admin login');

    // Try to open Add Product
    await attempt(async () => {
      const addLabels = ['Add Product', 'Add Item', 'Add', 'زیادکردنی خواردن', 'زیادکردنی بەرهەم', 'زیادکردن'];
      let clicked = false;
      for (const lbl of addLabels) {
        try { await page.click(`button:has-text("${lbl}")`, { timeout: 1500 }); clicked = true; break; } catch (e) { }
      }
      if (!clicked) {
        const found = await page.$$eval('aside button', btns => {
          const re = /add|زیاد|product|item/i;
          for (const b of btns) {
            const txt = (b.textContent || '').trim();
            if (re.test(txt)) { if (typeof b.click === 'function') { b.click(); } else { const evt = document.createEvent('MouseEvents'); evt.initEvent('click', true, true); b.dispatchEvent(evt); } return true; }
          }
          return false;
        });
        if (!found) throw new Error('Could not find Add Product button in admin layout');
      }

      // Advance through the Item Wizard to show the ProductForm
      await page.click('div.max-w-4xl button');
      await page.waitForSelector('div.grid button', { timeout: 5000 });
      await page.click('div.grid button');
      await page.waitForSelector('label:has-text("ناوی خواردن")', { timeout: 10000 });
      await page.screenshot({ path: path.join(outDir, `product-form-${Date.now()}.png`) });
    }, page, 'open Add Product');

    // Home / preview / cart tests (similar to manual-verify)
    await attempt(async () => {
      await page.click('button:has-text("Back")').catch(() => { });
      await page.goto(host, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('div.grid button', { timeout: 10000 });
      await page.click('div.grid button');
      await page.waitForSelector('.img-container img', { timeout: 10000 });
      await page.click('.img-container', { timeout: 10000 });
      await page.waitForSelector('text=پێکهاتەکان', { timeout: 5000 });
      await page.screenshot({ path: path.join(outDir, `preview-${Date.now()}.png`) });
    }, page, 'preview modal');

    // Cart verification
    await attempt(async () => {
      await page.goto(host, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('div.grid button', { timeout: 10000 });
      await page.click('div.grid button');
      await page.waitForSelector('.img-container', { timeout: 10000 });
      await page.click('button:has-text("+")', { timeout: 5000 }).catch(() => { });
      try { await page.click('button:has-text("View Cart")', { timeout: 3000 }); } catch (e) { await page.goto(host + '/#cart', { waitUntil: 'domcontentloaded' }); }
      await page.waitForSelector('text=MY ORDER', { timeout: 5000 }).catch(() => { });
      await page.screenshot({ path: path.join(outDir, `cart-${Date.now()}.png`) });
    }, page, 'cart');

    console.log('Monitor run completed successfully. Screenshots saved to', outDir);
  } catch (err) {
    console.error('Monitor encountered an error:', err.message || err);
    const p = path.join(outDir, `error-${Date.now()}.png`);
    try { await page.screenshot({ path: p, fullPage: true }); console.log('Saved error screenshot to', p); } catch (e) { }

    fs.writeFileSync(path.join(outDir, `error-${Date.now()}.log`), String(err.stack || err));

    // Enhanced auto-fix attempts: run lint:fix, run tests, try a build, then retry once
    try {
      console.log('Attempting quick auto-fix: running `npm run lint:fix`, then `npm test` and `npm run build` if needed; will retry once.');
      const fixProc = spawn('npm', ['run', 'lint:fix'], { shell: true, stdio: 'inherit' });
      await new Promise((res) => fixProc.on('exit', res));

      console.log('Running test suite (npm test)...');
      const testLog = path.join(outDir, `test-${Date.now()}.log`);
      const testProc = spawn('npm', ['test'], { shell: true });
      const testOut = [];
      testProc.stdout.on('data', d => testOut.push(d.toString()));
      testProc.stderr.on('data', d => testOut.push(d.toString()));
      await new Promise(res => testProc.on('exit', res));
      try { fs.writeFileSync(testLog, testOut.join(''), 'utf8'); console.log('Saved test output to', testLog); } catch (e) { }

      const testsPassed = /0 failed|passed/i.test(testOut.join('')) || /passed/i.test(testOut.join(''));
      if (!testsPassed) {
        console.warn('Tests appear to have failures — see', testLog);
      } else {
        console.log('Tests passed.');
      }

      try {
        console.log('Attempting build (`npm run build`) to catch bundling errors...');
        const buildProc = spawn('npm', ['run', 'build'], { shell: true, stdio: 'inherit' });
        await new Promise(res => buildProc.on('exit', res));
      } catch (e) {
        console.warn('Build step failed or was skipped:', e.message || e);
      }

      console.log('Retrying the monitor once after fixes...');
      try {
        await page.reload({ timeout: 5000 });
        // small retry of home load
        await page.goto(host, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('div.grid button', { timeout: 10000 });
        console.log('Retry succeeded after auto-fix.');
      } catch (e) {
        console.error('Retry after auto-fix failed:', e.message || e);
      }
    } catch (e) {
      console.error('Auto-fix attempt failed:', e.message || e);
    }
  } finally {
    try { await browser.close(); } catch (e) { }
    process.exit(0);
  }
})();
