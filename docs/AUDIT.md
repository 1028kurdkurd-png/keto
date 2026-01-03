# Audit: Blank Page in Chrome — Findings & Remediation

## Summary
- Observed symptom: Chrome sometimes shows a blank page after starting the dev server and opening front-end.
- Reproduced evidence: Playwright diagnostic artifacts in `tmp/diag-*` showed console logs with Workbox warnings about precaching without revisions and Firestore WebChannel transport errors.

## Likely root causes
1. Service Worker (Workbox) precaching an outdated or incompletely versioned `index.html` / assets causing the browser to serve broken content from cache.
2. Service Worker registered during development runs (non-production) can lead to `Workbox is precaching URLs without revision info` warnings and unexpected cached content.
3. Firestore transport errors occasionally cause runtime failures during client initialization (the SDK does offline persistence, but transport failures can produce repeated console errors that confuse debugging).

## Changes applied
- Disabled service worker in dev by default (`VitePWA.devOptions.enabled: false`) to avoid precache surprises during development.
- Added `navigateFallback: '/index.html'` and a `NetworkFirst` runtime caching rule for Firestore endpoints to reduce the risk of serving stale API responses.
- Added an offline Outbox (IndexedDB) implementation (`src/utils/offlineOutbox.ts`) to queue backup uploads when offline and retry them when back online.
- `menuService.saveBackupFile` now queues backup payloads failed by network into the Outbox instead of dropping them.
- App shows a small `Pending syncs` indicator with a manual `Sync now` button and automatically attempts to flush the outbox when the browser goes online.

## Recommended next steps
- Convert to `injectManifest` service worker (custom `src/sw.ts`) where we control background sync for POST uploads and more precise caching rules. Implemented initial `src/sw.ts` with a `/sync/backup` POST route backed by Workbox BackgroundSync (see notes below).
- Add Playwright E2E scenarios that test offline-first behavior (simulate offline, queue a backup upload, go online, ensure upload completes). Added `tests/e2e/offline.spec.ts` and `tests/e2e/offline-sync.spec.ts` to validate queueing and manual sync behavior.
- Add automated audit script that builds production and validates precache `revision` presence and `navigateFallback` behavior.

Notes on background sync:
- The SW registers a POST handler for `/sync/backup` using `BackgroundSyncPlugin`. When the page POSTs to `/sync/backup` while offline, the SW will queue and replay the request when connectivity returns.
- For full background upload (when the page is closed), you need either a server endpoint at `/sync/backup` that accepts the replayed POST and forwards it to Firebase, or implement direct upload logic inside the SW (requires handling Firebase Storage auth tokens or signed uploads). See next steps for implementation options.

## Where to look in the code
- `vite.config.ts` — PWA config changes
- `src/utils/offlineOutbox.ts` — outbox storage and processing
- `services/menuService.ts` — backup upload now enqueues into outbox on failure
- `App.tsx` — shows pending outbox UI and flush logic on `online`

---

This audit focused on the immediate blank-page cause (SW caching + Firestore transport warnings) and implemented safe, incremental fixes that avoid changing runtime behavior in production builds. For a more robust offline-first model, the next milestone is implementing a custom service worker via `injectManifest` and background sync for fetch-based uploads.