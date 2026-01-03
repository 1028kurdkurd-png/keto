#!/usr/bin/env node
// scripts/dev-server.js
// Cross-platform helper to start Vite dev server, ensure network accessibility, and auto-fallback to ngrok if remote devices can't reach localhost.

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
  console.log(`Starting Vite on port ${port} (host: true)...`);
  const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(cmd, ['run', 'dev', '--', '--host', '--port', String(port)], {
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
    console.log(`
Your dev server is available on your LAN at:
  ${reachableIP}
And locally at:
  http://localhost:${port}
Use the LAN URL on your iPad (Wi‑Fi) to access the site.
`);
    process.exit(0);
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
