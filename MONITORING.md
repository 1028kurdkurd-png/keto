# Monitoring & Auto-fix

This project includes a simple headful Chrome monitor script to run quick smoke checks and take screenshots on failure.

## Run the monitor

- One-off (headed Chrome):
  ```bash
  npm run monitor
  ```

- The script will:
  - Ensure the dev server is reachable (tries known hosts and will run `npm run dev` if needed)
  - Open admin, verify flows (Add Product), navigate home, open preview and cart
  - Save screenshots to `tmp/monitor-screenshots`

## Auto-fix behavior

If the monitor encounters an error it will:
- Save an error screenshot and an `error-*.log` in `tmp/monitor-screenshots`.
- Attempt a quick auto-fix sequence:
  1. `npm run lint:fix`
  2. `npm test` (outputs saved in `tmp/monitor-screenshots/test-*.log`)
  3. `npm run build` (best-effort to surface bundling errors)
  4. Retry a single time

If retry still fails, the monitor saves logs/screenshots and exits. Check the logs in `tmp/monitor-screenshots` and fix issues locally.

## Running continuously / background

You have several options to run this monitor continuously:

- Use PM2 (recommended for Linux/macOS, works on Windows via WSL or pm2-windows-service)
  ```bash
  npm i -g pm2
  pm2 start "npm -- run monitor" --name menu-monitor
  pm2 logs menu-monitor
  ```

- Use Task Scheduler on Windows: create a scheduled task that runs `cmd /c "cd D:\\dyad-apps\\menu && npm run monitor"` at the desired frequency or `At startup`.

- Use `start /B` for a background process on Windows (simple, manual):
  ```powershell
  Start-Process -FilePath "cmd" -ArgumentList "/c", "cd D:\\dyad-apps\\menu && npm run monitor" -NoNewWindow
  ```

## Notes & Tips
- Running the sync to Firestore (`menuService.syncWithConstants()`) will modify your database — confirm before running (see `scripts/sync-with-constants.js` if present).
- The monitor intentionally runs Chrome in headed mode so you can observe it. To run headless, edit `scripts/monitor-chrome.js` and set `headless: true`.

### Backup status (new)
- The Admin Dashboard now displays a live **Auto-backup status** badge (top-right Export/Import area). It shows the current state (RUNNING / SUCCESS / ERROR), timestamp, and version when available.
- This status is stored in localStorage key `mazen:autoBackup:status` and is broadcast via the `mazin:backup` event, so you can view the status from any device (e.g., iPad) by opening the Admin page.
- Make sure **Auto-backup** is enabled (Admin Dashboard toggle) and **Upload backups to cloud** is enabled if you want backups persisted to Firebase Storage.

### Rollback using Auto-backups
- The Admin Backups page now shows any local Auto-backup (if present) and lists cloud backups.
- Local auto-backup payloads are persisted to `localStorage` under `mazen:latestAutoBackupPayload` (full JSON payload) and metadata under `mazen:latestAutoBackup`.
- To restore from a local auto-backup:
  1. Open **Admin → Backups**. If a local auto-backup exists you'll see a **Local Auto-backup** card.
  2. Click **Preview** to inspect the backup payload, or **Download** to save a local file.
  3. Click **Restore** to perform a destructive replace; a pre-restore snapshot is created if the **Auto pre-restore snapshot** option is enabled.
  4. If your deployment uses server-side restores, you can also use **Server Replace** to run the replace via the backend functions.

### Running `sync-with-constants` safely
- The `scripts/sync-with-constants.ts` script will modify Firestore. Do NOT run it without a verified pre-backup.
- Recommended steps before running:
  1. In Admin → Backups: click **Create Backup** and wait for upload to finish. Confirm the backup record appears in the list.
  2. Verify `tmp/sync-backups` contains the pre-sync JSON file (if using local run scripts).
  3. Run the script locally with the guard variable set: `RUN_SYNC=1 node ./scripts/sync-with-constants.ts` (or `npm run sync:constants` if present). The script will abort unless `RUN_SYNC=1` is set. You can run the safety-check helper first: `node ./scripts/sync-with-constants-check.cjs` — it will verify a pre-sync backup exists in `tmp/sync-backups` and print instructions.
  4. Inspect the output and backup record to confirm the changes. If anything looks wrong, restore from the pre-backup using the Admin Backups page.

If you want, I can set up a PM2 configuration or a Windows scheduled task for you. Let me know which option you prefer.