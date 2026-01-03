# QA & Test Plan

## Summary
- Goal: Verify media workflows (upload, crop, update, delete), admin->user update propagation, RTL/LTR rendering, and core flows (menu browsing, cart) work reliably.

## Manual Smoke Checklist ✅
1. Build: `npm run build` — ensure `dist/` is created and `index.html` references assets.
2. Preview: Serve `dist/` (e.g., `node scripts/serve_dist.cjs`) and open `http://localhost:4173` in a browser.
3. Media Library:
   - Upload 1 file and verify it appears in the grid.
   - Upload batch of 3 files and verify all appear (max limit 10 enforced).
   - Select multiple images and delete them via bulk delete.
   - Crop an existing image and verify the change persists in the library.
4. Admin changes propagation:
   - Edit a category/section name in admin, save, and verify the consumer UI shows the update (should be near-instant).
   - Add / update / delete an item and verify the frontend reflects changes immediately.
5. RTL checks:
   - Switch language (ku/ar/fa) and verify layout direction `dir=rtl` and text alignment.
6. Accessibility checks:
   - Keyboard navigation through admin forms.
   - Form inputs have placeholders/labels.

## Automated Tests (Skeleton)
- Unit: use Vitest for small smoke tests and helper functions.
- E2E: use Playwright to visit the preview server and validate key DOM elements and flows.

## How to run (after installing deps)
1. Install test deps:
   - `npm i -D vitest @testing-library/react @testing-library/jest-dom` (for unit)
   - `npm i -D @playwright/test` (for e2e)
2. Run unit tests: `npm run test`
3. Start preview server: `node scripts/serve_dist.cjs`
4. Run e2e tests: `npm run test:e2e`

---

If you'd like, I can ✳️ add CI config (GitHub Actions) to run these tests on push — do you want that next?