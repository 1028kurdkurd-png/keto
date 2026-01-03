<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1up-SQhrI20uVty_89MFsquVdFT4hCYHn

For Netlify deployment see [docs/NETLIFY.md](docs/NETLIFY.md)

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

### Run locally for remote devices (iPad / other)

If you want your app accessible from an iPad on the same Wi‑Fi, or fallback to a tunnel (ngrok) when network access isn't available, use:

- Cross-platform (Node helper):
  `npm run dev:local`

- Cross-platform (auto-fix mode):
  `npm run dev:local:auto`  (sets `AUTO_FIX=true` and `OPEN_BROWSER=true` — helper will attempt automatic client-side remediation and open Chrome with a temporary profile)

- Windows (adds firewall rule automatically if you run as Admin):
  `npm run dev:local:win`

What the helper does:
- Starts Vite with `--host` so it listens on LAN
- Verifies whether your machine's LAN IP (e.g. `http://192.168.x.y:3000`) is reachable
- Performs an HTTP health check and runs a Playwright runtime diagnostic; it tries to unregister service workers, clear caches and storage, reload, and restart Vite if needed

Notes:
- Service worker (PWA) registration is disabled by default during development to avoid precache-related blank page issues. To test background sync locally, build and preview the production bundle and enable `PWA_DEV=true` if you want the SW in dev mode.

- Auto-remediation: the app now detects an empty `#root` on load (common when a stale service worker serves bad cached HTML) and will attempt to unregister service workers, clear `caches` and `indexedDB`, then reload the page. This can fix "nothing shows in Chrome" incidents automatically.

  - Quick manual remedies: visit the site with `?force_sw_fix=1` (forces remediation) or open DevTools Console and run `__runAutoFix(true)` to force a cleanup and reload.
  - If you use `run-chrome.bat` to open Chrome, it previously had a hard-coded path that could start the server in the wrong location; the script has been fixed to use the script directory so it reliably runs from the project root.
- The app now includes an offline Outbox (IndexedDB) to queue failed backup uploads and retry them when the browser is back online. You can see pending syncs in the app UI and trigger a manual sync.

- Admin: Auto-backup and restore — the Admin Dashboard shows a live auto-backup status and the Backups page supports restoring from cloud and local auto-backups. See `MONITORING.md` for details and recovery steps.
- A new custom service worker `src/sw.ts` (injectManifest) implements a `/sync/backup` route with Workbox Background Sync; to complete background uploads when the page is closed you should implement a server-side `/sync/backup` endpoint or implement upload logic in the SW that can talk to Firebase Storage securely.
- If automatic fixes fail and `AUTO_FIX=true`, it will attempt to open Chrome with a temporary profile (incognito + no extensions) to bypass local caches; if network isolation prevents LAN access it will fall back to `ngrok` and print a public URL

Note: `ngrok` will be run via `npx` (no global install required), and the PowerShell wrapper requires administrator privileges to add a firewall rule for the dev port.
