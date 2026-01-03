# Cloud Functions for Menu Backups

This folder contains Cloud Functions for backup and restore operations:

- `restore` — HTTP function that accepts a backup payload and performs a server-side restore (merge or replace).
- `scheduledBackup` — Pub/Sub scheduled function that creates periodic backups and saves them to Cloud Storage + Firestore.

Security
- The `restore` function requires a secret header `x-backup-secret` that must match the environment variable `BACKUP_SECRET` on the function runtime.
- Deploy the functions with restricted IAM (only trusted service accounts) and set `BACKUP_SECRET` via the Cloud Console or `gcloud`.
 - The `restore` function accepts either:
   - an `Authorization: Bearer <Firebase ID token>` header where the token's decoded claims include `admin: true`, or
   - the legacy `x-backup-secret` header that matches `BACKUP_SECRET` (use only for automation where tokens are not available).

Endpoints
- `POST /restore?mode=merge|replace` — body should be the export payload or `{ payload: <export> }`.

Example (curl):

```bash
BACKUP_SECRET=your-secret
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-backup-secret: $BACKUP_SECRET" \
  "https://<region>-<project>.cloudfunctions.net/restore?mode=replace" \
  --data '@backup.json'
```

Deploy

```bash
cd functions
npm install
# Use Firebase CLI or gcloud to deploy. Example with Firebase CLI:
firebase deploy --only functions:restore,functions:scheduledBackup --project <your-project-id>

# Then set the secret as an env var (Cloud Console or gcloud):
gcloud functions deploy restore --update-env-vars BACKUP_SECRET=your-secret --region=us-central1 --project <your-project-id>
```

Notes
- The `restore` function creates a pre-restore snapshot saved to the `backups` collection in Firestore before making changes.
- For stronger security, consider enforcing Firebase Auth or IAM-based access instead of a static secret.

Scheduling
- The `scheduledBackup` function runs according to the `BACKUP_CRON` environment variable (Cloud Scheduler cron syntax). Default: `0 3 * * *` (03:00 UTC daily).
- Optionally set `TIME_ZONE` and `SIGNED_URL_EXPIRES` environment variables.

Deploy the scheduled function with Firebase CLI (example):

```bash
cd functions
npm install
firebase deploy --only functions:scheduledBackup --project <your-project-id>
# set env var for schedule if you want custom cron and SECRET
gcloud functions deploy scheduledBackup --update-env-vars BACKUP_CRON="0 4 * * *",BACKUP_SECRET=your-secret --region=us-central1 --project <your-project-id>
```

Retrieval
- Backups are stored under the Storage path `backups/` and a Firestore record is created in the `backups` collection with `storagePath` and (optionally) a `fileUrl` signed URL.
# Cloud Functions for Menu Backups

This folder contains a single HTTP Cloud Function `restore` which accepts a backup payload and performs a server-side restore (merge or replace).

Security
- The function requires a secret header `x-backup-secret` that must match the environment variable `BACKUP_SECRET` on the function runtime.
- Deploy the function with restricted IAM (only trusted service accounts) and set `BACKUP_SECRET` via the Cloud Console or `gcloud`.

Endpoints
- `POST /restore?mode=merge|replace` — body should be the export payload or `{ payload: <export> }`.

Example (curl):

```bash
BACKUP_SECRET=your-secret
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-backup-secret: $BACKUP_SECRET" \
  "https://<region>-<project>.cloudfunctions.net/restore?mode=replace" \
  --data '@backup.json'
```

Deploy

```bash
cd functions
npm install
# Use Firebase CLI or gcloud to deploy. Example with Firebase CLI:
firebase deploy --only functions:restore --project <your-project-id>

# Then set the secret as an env var (Cloud Console or gcloud):
gcloud functions deploy restore --update-env-vars BACKUP_SECRET=your-secret --region=us-central1 --project <your-project-id>
```

Notes
- The function creates a pre-restore snapshot saved to the `backups` collection in Firestore before making changes.
- For stronger security, consider enforcing Firebase Auth or IAM-based access instead of a static secret.
