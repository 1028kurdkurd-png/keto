const fs = require('fs');
const path = require('path');

function fail(msg) { console.error('ABORT:', msg); process.exit(1); }
if (!process.env.RUN_SYNC) {
  fail('RUN_SYNC not set. This script is a safety-check wrapper. Set RUN_SYNC=1 when you are ready to run the actual sync.');
}

const syncDir = path.resolve(__dirname, '..', 'tmp', 'sync-backups');
let files = [];
try {
  if (fs.existsSync(syncDir)) files = fs.readdirSync(syncDir).filter(f => f.endsWith('.json')).map(f => path.join(syncDir, f));
} catch (e) { /* ignore */ }

if (!files.length) {
  console.error('No pre-sync backup files found in', syncDir);
  console.error('Please create a backup from Admin → Backups (Create Backup) and ensure it uploaded, or place a JSON backup into the sync-backups folder. Aborting.');
  process.exit(2);
}

console.log('Found pre-sync backups:');
files.forEach(f => console.log(' -', f));
console.log('\nYou can now run the actual sync script locally with RUN_SYNC=1. Example (PowerShell):');
console.log('  $env:RUN_SYNC=1; node ./scripts/sync-with-constants.ts');
console.log('\nNOTE: Depending on your Node/ts-node setup you may need to run with ts-node or use the compiled JS version.');
process.exit(0);
