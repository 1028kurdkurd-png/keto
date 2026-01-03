import fs from 'fs';
import path from 'path';

// Load menuService dynamically to avoid ESM resolution issues when running
// via ts-node/ts-node --esm in a project with "type":"module".
let menuService: any = null;

(async () => {
  try {
    const out = path.resolve(process.cwd(), 'tmp', 'sync-backups');
    fs.mkdirSync(out, { recursive: true });

    // Attempt to import via file URL to avoid package scope resolution issues.
    try {
      const svcUrl = new URL('../services/menuService.ts', import.meta.url).href;
      const mod = await import(svcUrl);
      menuService = mod.menuService || mod.default || mod;
    } catch (e) {
      try {
        const svcUrl2 = new URL('../services/menuService', import.meta.url).href;
        const mod2 = await import(svcUrl2);
        menuService = mod2.menuService || mod2.default || mod2;
      } catch (e2) {
        console.error('Could not import menuService (file URL attempts):', e2);
        throw e2;
      }
    }

    console.log('Exporting current DB as backup...');
    const payload = await menuService.exportData();
    const backupFile = path.join(out, `backup-before-sync-${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(payload, null, 2), 'utf8');
    console.log('Backup saved to', backupFile);

    console.log('About to run menuService.syncWithConstants(). This will update sections, categories and default items in your Firestore database.');
    console.log('If you are ready, set environment variable RUN_SYNC=1 and re-run this script to proceed.');

    if (process.env.RUN_SYNC === '1') {
      console.log('RUN_SYNC=1 detected — running syncWithConstants...');
      await menuService.syncWithConstants();
      console.log('syncWithConstants completed.');
    } else {
      console.log('No RUN_SYNC flag detected — sync not executed. To proceed with sync, re-run with RUN_SYNC=1');
      console.log('Example: RUN_SYNC=1 npm run sync:constants');
    }
  } catch (err) {
    console.error('Sync script encountered an error:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();