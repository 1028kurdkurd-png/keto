import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 }
  },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://127.0.0.1:4173',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI
  }
});
