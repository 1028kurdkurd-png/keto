# Backup & Restore Runbook

Purpose: operational instructions for exporting, downloading, importing, and recovering the application data backup for this project.

1) Export format
- JSON object with top-level keys: `meta`, `items`, `categories`, `sections`, `profiles`, `roles`.
- `meta` fields: `version` (app version), `createdAt` (ms timestamp), `checksum` (djb2 hex string).
- Images and media are NOT inlined by default; `payload` contains DB documents and storage paths (Storage `path` under `meta` / `storagePath`).

2) Creating backups
- From Admin UI: open the AdminBackups panel and click `Create Backup`. This will:
  - export data client-side using `menuService.exportData()`
  - upload the JSON to Firebase Storage via `menuService.saveBackupFile()`
  - create a `backups` record in Firestore with `meta`, `storagePath`, and `fileUrl`.
- Scheduled backups: Cloud Function `scheduledBackup` runs on `BACKUP_CRON` (default daily 03:00 UTC) and writes JSON to Storage + a Firestore record.

3) Downloading backups
- From Admin UI: use `Download` on a backup record — if `fileUrl` is present the UI will open it; otherwise the payload stored in the Firestore doc is downloaded.
- You can also fetch the file from Storage using the `storagePath` or the signed `fileUrl` if available.

4) Import / Restore (client-side)
- In AdminBackups, use `Upload JSON` to select an exported `.json` file.
- Options:
  - Merge (default): upserts payload into Firestore. Conflict strategy defaults to `merge` (existing fields preserved, payload fields applied). The `restoreFromExport` supports `conflictStrategy` (`merge` | `overwrite` | `skip`) and `idHandling` (`preserve` | `generate`).
  - Replace: destructive — deletes current collections then writes payload. The UI requires typing `REPLACE` and confirmation.
- Safety: when enabled, AdminBackups will create a pre-restore snapshot (backup) before applying merge/replace.

5) Import / Restore (server-side, recommended for destructive restores)
- Use the Cloud Function `restore` (HTTP) with header `x-backup-secret` = `BACKUP_SECRET` env var. The function will create a pre-snapshot then perform `merge` or `replace` depending on `?mode=`.
- Example curl:
  ```bash
  curl -X POST \
    -H "Content-Type: application/json" \
    -H "x-backup-secret: $BACKUP_SECRET" \
    "https://<region>-<project>.cloudfunctions.net/restore?mode=replace" \
    --data '@backup.json'
  ```

6) Recovery procedure (if restore fails)
- Immediately stop any automated writes (pause scheduled backups or freeze app write traffic if possible).
- Locate most recent pre-restore snapshot in `backups` collection (filter by `meta.note == 'pre-restore-snapshot'` or `performedBy`), or use the scheduled backups.
- Download the snapshot JSON and re-run import in `merge` mode to recover data.

7) Size limits & performance
- Firestore has limits on batch writes. Replace operations use batched commits (chunks of ~300-400) to avoid exceeding limits.
- Large exports (many MBs) may be uploaded to Storage and fetched via signed URL. The client UI streams download progress for large files.

8) Security & permissions
- Admin-only features (create backup, list backups, pre-snapshot, save backup) are protected via a client-side re-auth flow and `menuService.ensureAdmin()` which checks Firebase custom claim `admin`.
- Cloud Function `restore` uses `BACKUP_SECRET` by default. For higher security, configure the function to validate Identity Tokens or use IAM-restricted endpoints.

9) CI & testing
- Unit tests are in `tests/unit/` (Vitest). Playwright e2e tests are in `tests/e2e/`.
- CI workflow in `.github/workflows/ci.yml` runs Vitest and Playwright and uploads reports.

10) Troubleshooting
- If uploads fail: check Storage bucket permissions and Firebase Storage quotas.
- If restore fails mid-flight: function attempts a rollback using the pre-snapshot (merge). If rollback fails, manual intervention is required — use the pre-snapshot JSON to restore collections.
- If admin claim not present: set custom claim `admin` using Firebase Admin SDK for the user UID.

11) Quick commands
```bash
# Create manual backup from local dev (runs admin UI):
# Use the AdminBackups UI -> Create Backup

# Deploy cloud functions (example):
cd functions
npm install
firebase deploy --only functions:restore,functions:scheduledBackup --project <your-project-id>

# Trigger restore via curl (server-side):
BACKUP_SECRET=your-secret
curl -X POST -H "Content-Type: application/json" -H "x-backup-secret: $BACKUP_SECRET" "https://<region>-<project>.cloudfunctions.net/restore?mode=merge" --data '@backup.json'
```
