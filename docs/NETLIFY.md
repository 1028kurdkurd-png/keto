# Deploying to Netlify

This project includes a `netlify.toml` and `public/_redirects` to support SPA routing.

Quick steps:

1. Push your repo to GitHub.
2. In Netlify, click "New site from Git" and connect your GitHub repo.
3. Set **Build command** to `npm run build` and **Publish directory** to `dist`.
4. (Optional) Add an environment variable `VITE_ENABLE_SW=true` in Netlify's Site settings → Build & deploy → Environment to enable the service worker in production.

Troubleshooting:

- If you see a blank page after deploy, open Chrome DevTools → Application → Service Workers and unregister any service workers.
- Check **Caches** and **IndexedDB** and remove stale entries if needed.
- In Console run: `localStorage.removeItem('sw_auto_fix_done'); __runAutoFix(true);` — this will clear SW/caches/IndexedDB and reload the page.

Testing tips:

- Enable Deploy Previews in Netlify and verify preview URLs with the included Playwright tests.
- The repo includes `tests/e2e/debug-smoke.spec.ts` which captures SW, caches and indexedDB state and helps diagnosing blank page issues.

Preflight CI check:

- The project adds a Playwright preflight test `tests/e2e/preflight.spec.ts` which runs in CI against the preview build or Netlify Deploy Preview.
  - It validates that the main root is visible; if not visible it will attempt the in-app auto-fix (`window.__runAutoFix(true)`) and re-check.
  - If the page remains broken after the auto-fix, the test fails CI and saves a screenshot in `tmp/preflight-*.png` for debugging.
  - Ensure Deploy Previews are enabled in Netlify and the GitHub Actions secrets (`NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`) are configured to enable the Deploy Preview test step.

CI / GitHub Actions:

- This repository contains `.github/workflows/e2e-on-build.yml` which runs on `push` and `pull_request`.
  - It builds the site with `VITE_ENABLE_SW=true`, serves `dist` locally, and runs the Playwright E2E tests (`sw-optin` and `debug-smoke`) against the served preview.
  - If you want the workflow to additionally deploy to Netlify and run the same tests against a Deploy Preview, set these repository secrets in GitHub:
    - `NETLIFY_AUTH_TOKEN` — a personal access token from Netlify (User settings → Applications → Personal access tokens).
    - `NETLIFY_SITE_ID` — available in your Site settings on Netlify (Site settings → Site information → Site ID).
  - When both secrets are present the workflow will attempt a preview deploy using the Netlify CLI and run the tests against the returned preview URL.

- Note: the Netlify deploy step is optional and gated on the presence of the two secrets above. If you don't want the deploy step, omit the secrets and the workflow will still build and run the E2E tests against the built `dist` artifacts.