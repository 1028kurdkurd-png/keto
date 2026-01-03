import { chromium } from 'playwright';

(async () => {
  console.log('check-render: starting');
  try {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    console.log('check-render: browser launched');
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } });
    const page = await ctx.newPage();

    page.on('console', msg => {
      console.log('PAGE CONSOLE:', msg.type(), msg.text());
    });
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    page.on('requestfailed', req => console.log('REQUEST FAILED:', req.url(), req.failure()?.errorText));

    try {
      await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 10000 });
      const title = await page.title();
      console.log('Page title:', title);
      const bodyText = await page.$eval('body', b => b.innerText.slice(0, 1000));
      console.log('Body snippet:', bodyText.replace(/\n/g,'\\n'));

      const rootHtml = await page.$eval('#root, #app, body', el => el.innerHTML.slice(0, 1000));
      console.log('Root HTML snippet length:', rootHtml.length);
    } catch (e) {
      console.error('Error loading page:', e.message || e);
    } finally {
      await browser.close();
      console.log('check-render: browser closed');
      process.exit(0);
    }
  } catch (err) {
    console.error('check-render: fatal error', err && (err.message || err));
    process.exit(1);
  }
})();
