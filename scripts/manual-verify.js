import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
(async () => {
  const out = path.resolve(process.cwd(), 'tmp', 'manual-verify-screenshots');
  fs.mkdirSync(out, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 800, height: 1200 } });
  const page = await context.newPage();

  let host = process.env.TEST_HOST || null;
  const hosts = [host, 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://127.0.0.1:4173', 'http://localhost:4173'].filter(Boolean);

  console.log('Opening admin login...');
  let opened = false;
  for (const h of hosts) {
    try {
      await page.goto(h + '/admin2001', { timeout: 5000 });
      host = h;
      opened = true;
      break;
    } catch (e) {
      console.log('Could not reach', h);
    }
  }
  if (!opened) {
    console.error('Could not reach dev server on any known hosts:', hosts);
    process.exit(1);
  }

  await page.fill('input[type="password"]', process.env.VITE_ADMIN_PASSWORD || 'keto55');
  await page.press('input[type="password"]', 'Enter');
  await page.click('input[type="password"] + button');
  await page.waitForSelector('text=Export / Import', { timeout: 10000 });

  // Open Add Product (upload) view — try multiple labels and a fallback scan
  await page.waitForSelector('aside', { timeout: 10000 }).catch(() => { });
  const addLabels = ['Add Product', 'Add Item', 'Add', 'زیادکردنی خواردن', 'زیادکردنی بەرهەم', 'زیادکردن'];
  let clicked = false;
  for (const lbl of addLabels) {
    try { await page.click(`button:has-text("${lbl}")`, { timeout: 1500 }); clicked = true; break; } catch (e) { /* try next */ }
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
  // Now product form should be visible (wait for field label)
  await page.waitForSelector('label:has-text("ناوی خواردن")', { timeout: 10000 });
  await page.screenshot({ path: path.join(out, 'product-form.png'), fullPage: false });
  console.log('Saved Product Form screenshot');

  // Verify languages order by taking another screenshot of language tabs
  await page.screenshot({ path: path.join(out, 'product-form-langs.png'), clip: { x: 300, y: 300, width: 800, height: 80 } }).catch(() => { });

  // Go to home, open a category then click first item image to open preview modal
  await page.click('button:has-text("Back")').catch(() => { }); // go back if needed
  await page.goto(host, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('div.grid button', { timeout: 10000 });
  // Open first category
  await page.click('div.grid button');
  // Wait for item thumbnails to appear and open first item preview
  await page.waitForSelector('.img-container img', { timeout: 10000 });
  await page.click('.img-container', { timeout: 10000 });
  await page.waitForSelector('text=پێکهاتەکان', { timeout: 5000 });
  await page.screenshot({ path: path.join(out, 'preview-ingredients.png') });
  console.log('Saved preview modal screenshot');

  // Close preview modal (if open)
  await page.click('button:has-text("x")').catch(async () => { try { await page.click('.fixed.inset-0'); } catch (e) { } });

  // Check Team translations: set language to Kurdish then open Team view
  await page.selectOption('select', 'ku');
  // Open Team (Kurdish label) — try direct click then fallback to scanning buttons
  // Check whether a Team button exists; it may be hidden by settings
  const teamExists = await page.$$eval('button', btns => btns.some(b => { const txt = (b.textContent || '').trim(); return txt.includes('تیم') || /team/i.test(txt); }));
  if (!teamExists) {
    console.log('Team section not visible (skipping team screenshot)');
  } else {
    let teamClicked = false;
    try { await page.click('button:has-text("تیم")', { timeout: 2000 }); teamClicked = true; } catch (e) {
      // fallback: find any button whose text contains Kurdish 'تیم' or English 'team'
      teamClicked = await page.$$eval('button', btns => {
        for (const b of btns) {
          const txt = (b.textContent || '').trim();
          if (txt.includes('تیم') || /team/i.test(txt)) { b.click(); return true; }
        }
        return false;
      });
    }
    if (!teamClicked) {
      console.log('Team section present but could not click it (skipping)');
    } else {
      await page.waitForSelector('h2:has-text("تیم")', { timeout: 5000 });
      await page.screenshot({ path: path.join(out, 'team-ku.png') });
      console.log('Saved team (ku) screenshot');
    }
  }

  // Cart verification: add first item to cart and open cart
  await page.goto(host, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('div.grid button', { timeout: 10000 });
  await page.click('div.grid button');
  await page.waitForSelector('.img-container', { timeout: 10000 });
  // Click plus button on first item to add to cart
  await page.click('button:has-text("+")', { timeout: 5000 }).catch(() => { });
  // Open cart (footer button) or navigate directly
  try { await page.click('button:has-text("View Cart")', { timeout: 3000 }); } catch (e) { await page.goto(host + '/#cart', { waitUntil: 'domcontentloaded' }); }
  await page.waitForSelector('text=MY ORDER', { timeout: 5000 }).catch(() => { });
  await page.screenshot({ path: path.join(out, 'cart.png') });
  console.log('Saved cart screenshot');

  await browser.close();
  console.log('Manual verification screenshots saved to', out);
})();