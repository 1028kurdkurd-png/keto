#!/usr/bin/env node
// scripts/dev-server.cjs
// CommonJS copy of dev helper so `require` works when package.json uses "type": "module".

const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');

const DEFAULT_PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

function getLocalIPv4s() {
  const nets = os.networkInterfaces();
  const results = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        results.push(net.address);
      }
    }
  }
  return results;
}

function checkUrl(url, timeout = 3000) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(timeout, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForLocalhost(port, timeout = 15000) {
  const start = Date.now();
  const url = `http://localhost:${port}`;
  while (Date.now() - start < timeout) {
    if (await checkUrl(url)) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function spawnVite(port) {
  console.log(`Starting Vite on port ${port} (host: true) via node ${process.execPath} node_modules/vite/bin/vite.js`);
  const cmd = process.execPath; // the node binary
  const viteBin = require('path').join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js');
  const child = spawn(cmd, [viteBin, '--host', '--port', String(port)], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: Object.assign({}, process.env, { PORT: String(port) }),
  });
  child.on('exit', (code) => {
    if (code !== 0) console.log(`Vite exited with code ${code}`);
  });
  return child;
}

function startNgrok(port) {
  console.log('Attempting ngrok fallback (requires network access to install/run ngrok)...');
  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const child = spawn(cmd, ['ngrok', 'http', String(port), '--log=stdout'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'inherit'],
  });

  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);
    const m = chunk.match(/(https?:\/\/[\w\-\.]+ngrok\.io[\w\-\./?=&]*)/i);
    if (m) {
      console.log(`
ngrok forwarding URL detected: ${m[1]}
Use this URL on your iPad if local network access fails.
`);
    }
  });

  child.on('error', (err) => {
    console.log('Failed to run ngrok via npx:', err.message);
  });

  child.on('exit', (code) => {
    if (code !== 0) console.log(`ngrok process exited with code ${code}`);
  });

  return child;
}

(async () => {
  let port = DEFAULT_PORT;
  let viteProcess = null;

  // try to start Vite, increment port if EADDRINUSE
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      viteProcess = spawnVite(port);
      // Wait for localhost to respond
      const up = await waitForLocalhost(port, 10000);
      if (!up) {
        console.log(`Vite did not respond on localhost:${port} within timeout.`);
        // give it a couple more seconds
        const extra = await waitForLocalhost(port, 5000);
        if (!extra) throw new Error('no-response');
      }
      console.log(`Server responsive at http://localhost:${port}`);
      break;
    } catch (err) {
      console.log(`Port ${port} seems unavailable or server did not start: ${err.message || err}`);
      port++;
      console.log(`Trying next port ${port}...`);
      if (viteProcess) {
        try { viteProcess.kill(); } catch(e) {}
      }
    }
  }

  if (!viteProcess) {
    console.error('Failed to start Vite on any port. Aborting.');
    process.exit(1);
  }

  // After started locally, test network reachability via each non-internal IP
  const localIPs = getLocalIPv4s();
  console.log('Local non-internal IP addresses:', localIPs.join(', ') || 'none');
  let reachableIP = null;
  for (const ip of localIPs) {
    const url = `http://${ip}:${port}`;
    process.stdout.write(`Testing ${url} ... `);
    try {
      const ok = await checkUrl(url, 3000);
      console.log(ok ? 'reachable' : 'no response');
      if (ok) { reachableIP = url; break; }
    } catch (e) {
      console.log('error');
    }
  }

  if (reachableIP) {
    console.log(`\nYour dev server is available on your LAN at:\n  ${reachableIP}\nAnd locally at:\n  http://localhost:${port}\n`);

    // Health check and automatic remediation when the server responds but serves nothing useful
    async function fetchUrlRaw(url, timeout = 4000) {
      return new Promise((resolve) => {
        try {
          const lib = url.startsWith('https') ? require('https') : require('http');
          const req = lib.get(url, { timeout }, (res) => {
            let data = '';
            res.setEncoding('utf8');
            res.on('data', (c) => { if (data.length < 20000) data += c; });
            res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
          });
          req.on('error', () => resolve(null));
          req.on('timeout', () => { req.destroy(); resolve(null); });
        } catch (e) { resolve(null); }
      });
    }

    function openBrowserUrl(url) {
      try {
        if (process.platform === 'win32') {
          spawn('cmd', ['/c', 'start', 'chrome', url], { stdio: 'ignore', detached: true });
        } else if (process.platform === 'darwin') {
          spawn('open', ['-a', 'Google Chrome', url], { stdio: 'ignore', detached: true });
        } else {
          spawn('xdg-open', [url], { stdio: 'ignore', detached: true });
        }
      } catch (e) { /* ignore */ }
    }

    const localUrl = `http://localhost:${port}`;
    (async () => {
      console.log('Performing HTTP health check on', localUrl);
      const res = await fetchUrlRaw(localUrl);
      const looksGood = res && res.statusCode === 200 && /text\/html/.test((res.headers && res.headers['content-type']) || '') && (res.body && res.body.length > 100);
      if (looksGood) {
        console.log('Health check passed: HTML served at root. Running runtime diagnostics to detect client-side errors...');

        async function runPlaywrightDiagnostic(url) {
          try {
            const fs = require('fs');
            const { chromium } = require('@playwright/test');
            const browser = await chromium.launch({ headless: true });
            const context = await browser.newContext();
            const page = await context.newPage();
            const logs = [];
            page.on('console', (m) => logs.push({ type: 'console:' + m.type(), text: m.text() }));
            page.on('pageerror', (err) => logs.push({ type: 'pageerror', text: String(err) }));

            // prepare artifact dir
            const dir = require('path').join(process.cwd(), 'tmp', `diag-${Date.now()}`);
            try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}

            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 7000 });
            // wait a short time for runtime errors
            await page.waitForTimeout(500);
            const content = await page.content();
            const hasUsableDOM = content && content.length > 100;

            // save initial artifacts
            try {
              fs.writeFileSync(require('path').join(dir, 'before.html'), content || '');
              await page.screenshot({ path: require('path').join(dir, 'before.png'), fullPage: true });
              fs.writeFileSync(require('path').join(dir, 'logs-before.json'), JSON.stringify(logs, null, 2));
            } catch (e) { /* ignore */ }

            if (logs.length === 0 && hasUsableDOM) {
              await browser.close();
              return { ok: true, fixed: false, logsBefore: [], logsAfter: [], artifactDir: dir };
            }

            console.log('Playwright diagnostics: found console/page errors or minimal DOM; attempting remediation...');
            console.log('Console / page errors (before):', logs);

            // Attempt remediation: unregister service workers, clear caches and storage, then reload
            try {
              await page.evaluate(async () => {
                try {
                  const regs = await navigator.serviceWorker.getRegistrations();
                  await Promise.all(regs.map(r => r.unregister()));
                } catch (e) {}
                try {
                  const keys = await caches.keys();
                  await Promise.all(keys.map(k => caches.delete(k)));
                } catch (e) {}
                try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}
              });
            } catch (e) { console.log('Remediation evaluate failed:', e.message); }

            await page.reload({ waitUntil: 'domcontentloaded', timeout: 7000 });
            await page.waitForTimeout(500);

            const logsAfter = [];
            page.on('console', (m) => logsAfter.push({ type: 'console:' + m.type(), text: m.text() }));
            page.on('pageerror', (err) => logsAfter.push({ type: 'pageerror', text: String(err) }));

            const contentAfter = await page.content();

            // save after artifacts
            try {
              fs.writeFileSync(require('path').join(dir, 'after.html'), contentAfter || '');
              await page.screenshot({ path: require('path').join(dir, 'after.png'), fullPage: true });
              fs.writeFileSync(require('path').join(dir, 'logs-after.json'), JSON.stringify(logsAfter, null, 2));
            } catch (e) { /* ignore */ }

            await browser.close();

            const success = contentAfter && contentAfter.length > 100;
            return { ok: success, fixed: success, logsBefore: logs, logsAfter, artifactDir: dir };
          } catch (e) {
            return { ok: false, error: e.message || String(e) };
          }
        }

        const diag = await runPlaywrightDiagnostic(localUrl);
        if (diag.ok) {
          if (diag.logsBefore && diag.logsBefore.length) {
            console.log('Diagnostics fixed client-side issues. Logs before:', diag.logsBefore, 'Logs after:', diag.logsAfter);
            if (diag.artifactDir) console.log('Saved diagnostic artifacts to:', diag.artifactDir);
          } else {
            console.log('No client-side errors detected by Playwright.');
          }
          if (process.env.OPEN_BROWSER === 'true') openBrowserUrl(localUrl);
          process.exit(0);
        }

        console.log('Playwright diagnostic failed or could not fix the issue:', diag.error || 'unknown');
        if (diag.artifactDir) console.log('Saved diagnostic artifacts to:', diag.artifactDir);
        console.log('Falling back to opening Chrome (incognito) to bypass profile cache, and starting ngrok fallback.');

        // Try opening real Chrome with fresh profile/incognito to bypass caches
        try {
          const autoFix = process.env.AUTO_FIX === 'true';
          if (autoFix) {
            const os = require('os');
            const fs = require('fs');
            const path = require('path');
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-profile-'));
            console.log('AUTO_FIX enabled: launching Chrome with temporary profile at', tmpDir);
            if (process.platform === 'win32') {
              spawn('cmd', ['/c', 'start', '""', 'chrome', `--user-data-dir=${tmpDir}`, '--new-window', '--incognito', '--disable-extensions', '--disable-application-cache', localUrl], { stdio: 'ignore', detached: true });
            } else if (process.platform === 'darwin') {
              spawn('open', ['-a', 'Google Chrome', '--args', `--user-data-dir=${tmpDir}`, '--incognito', localUrl], { stdio: 'ignore', detached: true });
            } else {
              // try common linux chrome binary names
              const chromeCmd = 'google-chrome';
              spawn(chromeCmd, [`--user-data-dir=${tmpDir}`, '--incognito', localUrl], { stdio: 'ignore', detached: true });
            }
          } else {
            if (process.platform === 'win32') {
              spawn('cmd', ['/c', 'start', 'chrome', '--new-window', '--incognito', '--disable-extensions', '--disable-application-cache', localUrl], { stdio: 'ignore', detached: true });
            } else if (process.platform === 'darwin') {
              spawn('open', ['-a', 'Google Chrome', '--args', '--incognito', localUrl], { stdio: 'ignore', detached: true });
            } else {
              spawn('xdg-open', [localUrl], { stdio: 'ignore', detached: true });
            }
          }
        } catch (e) { console.log('Failed to open Chrome automatically:', e.message); }

        const ngrokChild = startNgrok(port);

        console.log('If ngrok provides a public URL it will be printed above; open it on your iPad to test.');
        // Exit with non-zero to indicate remediation was needed
        process.exit(1);
      }

      console.log('Health check failed: root did not return usable HTML. Trying /index.html ...');
      const resIndex = await fetchUrlRaw(`${localUrl}/index.html`);
      if (resIndex && resIndex.statusCode === 200 && resIndex.body && resIndex.body.length > 100) {
        console.log('/index.html served correctly. Opening browser to local URL.');
        openBrowserUrl(localUrl);
        process.exit(0);
      }

      console.log('Still no HTML. Attempting to restart Vite once and re-check...');
      try { viteProcess.kill(); } catch(e) {}
      viteProcess = spawn(process.execPath, [require('path').join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js'), '--host', '--port', String(port)], { cwd: process.cwd(), stdio: 'inherit' });

      // wait a moment
      await new Promise((r) => setTimeout(r, 2000));
      const resAfter = await fetchUrlRaw(localUrl, 5000);
      if (resAfter && resAfter.statusCode === 200 && resAfter.body && resAfter.body.length > 100) {
        console.log('Restart fixed the issue — page served. Opening browser.');
        openBrowserUrl(localUrl);
        process.exit(0);
      }

      console.log('\nAutomatic fixes failed. Falling back to starting ngrok and suggesting firewall check.');
      const ngrokChild = startNgrok(port);

      // On Windows, try to gently add firewall rule (only if running elevated)
      if (process.platform === 'win32') {
        try {
          const { spawnSync } = require('child_process');
          const rule = `Vite Dev ${port}`;
          console.log('Ensuring firewall rule exists (requires admin):', rule);
          spawnSync('netsh', ['advfirewall', 'firewall', 'add', 'rule', `name=${rule}`, 'dir=in', 'action=allow', 'protocol=TCP', `localport=${port}`], { stdio: 'inherit' });
        } catch (e) { console.log('Failed to add firewall rule automatically:', e.message); }
      }

      console.log('If ngrok provides a public URL it will be printed above; open it on your iPad to test.');

      // keep process alive while child processes run
      const onExit = () => {
        try { if (viteProcess) viteProcess.kill(); } catch(e) {}
        try { if (ngrokChild) ngrokChild.kill(); } catch(e) {}
        process.exit();
      };
      process.on('SIGINT', onExit);
      process.on('SIGTERM', onExit);
    })();

    return; // don't exit immediately; health-check routine will `process.exit` when done
  }

  console.log('\nNo LAN IP was reachable from this machine. If your iPad is on the same Wi‑Fi this usually means a network isolation issue.');

  // Try to launch ngrok fallback
  const ngrokChild = startNgrok(port);

  // If on Windows, warn about firewall
  if (process.platform === 'win32') {
    console.log('\nNote: On Windows you may need to allow the dev port through the firewall. Run scripts/run-dev.ps1 as Administrator to enable an automatic firewall rule if needed.');
  }

  // keep process alive while child processes run
  const onExit = () => {
    try { if (viteProcess) viteProcess.kill(); } catch(e) {}
    try { if (ngrokChild) ngrokChild.kill(); } catch(e) {}
    process.exit();
  };
  process.on('SIGINT', onExit);
  process.on('SIGTERM', onExit);
})();