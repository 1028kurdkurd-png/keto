Title: chore: make PWA safe for Netlify + auto-fix blank-page (service worker opt-in, remediation & tests)

Description:
- Detect blank/invisible root at startup and perform an automatic remediation:
  - Unregister service workers, clear caches, delete indexedDB databases.
  - Show a visible remediation banner and expose `window.__runAutoFix(force)`.
  - Prevent reload loops via `localStorage.sw_auto_fix_done`.
- Make runtime service worker registration opt-in for production:
  - Controlled by env: `VITE_ENABLE_SW=true`.
  - Adds `src/registerServiceWorker.ts` to safely register SW only in secure contexts.
- Add `netlify.toml` and `public/_redirects` for SPA routing on Netlify.
- Add tests and diagnostics:
  - `tests/unit/autoFix.test.ts` (vitest)
  - `tests/e2e/debug-smoke.spec.ts` (diagnostic capture)
  - `tests/e2e/sw-optin.spec.ts` (asserts presence of `/sw.js` when `VITE_ENABLE_SW=true`)
- Docs: `docs/NETLIFY.md` (Netlify notes & instructions)

Notes:
- The branch is `feature/netlify-safety` and has been pushed to origin. If you want me to create the PR automatically, provide a GitHub personal access token with `repo` scope (I can create it for you).
- Otherwise, open this link in the browser to create the PR manually:
  https://github.com/1028kurdkurd-png/menu/pull/new/feature/netlify-safety

Checklist for reviewers:
- Unit tests pass (Vitest)
- E2E smoke & debug tests pass locally against preview
- `dist/sw.js` is produced when building with `VITE_ENABLE_SW=true`
- `netlify.toml` and `public/_redirects` in repo (SPA behavior)
- Confirm banner displays during remediation and `window.__runAutoFix` works
- Confirm service worker only registers in production when `VITE_ENABLE_SW=true`
- Sanity-check that the remediation does not run under normal healthy loads (no false positives)
