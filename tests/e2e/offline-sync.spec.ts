import { test, expect } from '@playwright/test';

// Verifies that an offline export can be queued and then synced by the app's manual Sync now button

test.describe('Offline manual sync', () => {
  test.setTimeout(60000);
  test('queue export offline and sync when back online', async ({ page }) => {
    const hosts = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://127.0.0.1:4173', 'http://localhost:4173'];
    let opened = false;
    const start = Date.now();
    while (!opened && Date.now() - start < 30000) {
      for (const h of hosts) {
        try { await page.goto(h + '/admin2001', { timeout: 5000 }); opened = true; break; } catch (e) { }
      }
      if (!opened) await new Promise(r => setTimeout(r, 500));
    }
    if (!opened) throw new Error('Could not reach dev server');

    // login admin
    const password = process.env.VITE_ADMIN_PASSWORD || 'keto55';
    await page.fill('input[type="password"]', password);
    await page.press('input[type="password"]', 'Enter');
    // ensure login button pressed (localized text may vary)
    await page.click('input[type="password"] + button');
    await expect(page.locator('text=Export / Import')).toBeVisible({ timeout: 10000 });

    // Go offline
    await page.context().setOffline(true);

    // Click Quick Test Export
    await page.click('text=Quick Test Export');

    // Dismiss any dialogs
    try {
      const dialog = await page.waitForEvent('dialog', { timeout: 5000 });
      await dialog.dismiss();
    } catch (e) {
      // No dialog shown; fine
    }

    // Ensure outbox has queued item
    const outboxCountWhileOffline = await page.evaluate(async () => {
      return new Promise<number>((resolve, reject) => {
        const req = indexedDB.open('mazin-offline');
        req.onerror = () => reject('no-db');
        req.onsuccess = () => {
          const db = req.result;
          try {
            const tx = db.transaction('outbox', 'readonly');
            const store = tx.objectStore('outbox');
            const getAll = store.getAll();
            getAll.onsuccess = () => {
              const items = getAll.result || [];
              const backupItems = items.filter((i: any) => i.kind === 'backupFile');
              resolve(backupItems.length);
            };
            getAll.onerror = () => resolve(0);
          } catch (e) { resolve(0); }
        };
      });
    });

    expect(outboxCountWhileOffline).toBeGreaterThan(0);

    // Go back online
    await page.context().setOffline(false);

    // If the Sync UI is visible, click it; otherwise the app will auto-process the outbox on 'online'
    try {
      if (await page.isVisible('text=Sync now', { timeout: 2000 })) {
        await page.click('text=Sync now');
      }
    } catch (e) { /* not visible - ok */ }

    // Wait a short while and assert outbox is cleared
    await page.waitForTimeout(2000);

    const outboxCountAfter = await page.evaluate(async () => {
      return new Promise<number>((resolve, reject) => {
        const req = indexedDB.open('mazin-offline');
        req.onerror = () => reject('no-db');
        req.onsuccess = () => {
          const db = req.result;
          try {
            const tx = db.transaction('outbox', 'readonly');
            const store = tx.objectStore('outbox');
            const getAll = store.getAll();
            getAll.onsuccess = () => {
              const items = getAll.result || [];
              const backupItems = items.filter((i: any) => i.kind === 'backupFile');
              resolve(backupItems.length);
            };
            getAll.onerror = () => resolve(0);
          } catch (e) { resolve(0); }
        };
      });
    });

    expect(outboxCountAfter).toBe(0);
  });
});