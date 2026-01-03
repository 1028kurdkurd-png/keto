const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// Require a secret header for basic protection. Set via environment variable BACKUP_SECRET.
const SECRET_HEADER = 'x-backup-secret';

const COLLECTIONS = ['menuItems', 'categories', 'sections', 'profiles', 'roles'];

async function gatherExport() {
  const payload = {};
  for (const col of COLLECTIONS) {
    const snap = await db.collection(col).get();
    payload[col === 'menuItems' ? 'items' : (col === 'categories' ? 'categories' : (col === 'sections' ? 'sections' : (col === 'profiles' ? 'profiles' : 'roles')))] = snap.docs.map(d => d.data());
  }
  payload.meta = { version: 'server-1.0.0', createdAt: Date.now() };
  return payload;
}

async function savePreSnapshot(payload) {
  const meta = { version: payload.meta?.version || 'server-1.0.0', createdAt: Date.now(), note: 'pre-restore-snapshot' };
  const docRef = await db.collection('backups').add({ meta, payload, performedBy: 'cloud-function', createdAt: Date.now() });
  return { id: docRef.id };
}

async function deleteAllInCollection(col) {
  const snap = await db.collection(col).get();
  if (snap.empty) return 0;
  const batch = db.batch();
  let i = 0;
  snap.docs.forEach(d => {
    batch.delete(d.ref);
    i++;
  });
  await batch.commit();
  return i;
}

async function writeDocsInBatches(col, docs) {
  const chunk = 400; // safe
  let added = 0;
  for (let i = 0; i < docs.length; i += chunk) {
    const batch = db.batch();
    const slice = docs.slice(i, i + chunk);
    slice.forEach(d => {
      const ref = db.collection(col).doc();
      batch.set(ref, d);
      added++;
    });
    await batch.commit();
  }
  return added;
}

async function mergePayload(payload, options = { conflictStrategy: 'merge', idHandling: 'preserve' }) {
  const { conflictStrategy = 'merge', idHandling = 'preserve' } = options;
  const report = { added: 0, updated: 0, skipped: 0, failed: [] };
  // For each collection, upsert by `id` field if present
  for (const col of COLLECTIONS) {
    const key = col === 'menuItems' ? 'items' : (col === 'categories' ? 'categories' : (col === 'sections' ? 'sections' : (col === 'profiles' ? 'profiles' : 'roles')));
    const docs = Array.isArray(payload[key]) ? payload[key] : [];
    const snap = await db.collection(col).get();
    for (const p of docs) {
      try {
        const existing = snap.docs.find(d => {
          const data = d.data();
          return (data && data.id !== undefined && p && p.id !== undefined && data.id === p.id);
        });
        if (existing) {
          if (conflictStrategy === 'skip') {
            report.skipped++;
            continue;
          }
          if (conflictStrategy === 'overwrite') {
            await existing.ref.set(p, { merge: false });
            report.updated++;
            continue;
          }
          // merge
          await existing.ref.set({ ...existing.data(), ...p }, { merge: false });
          report.updated++;
        } else {
          const toWrite = { ...p };
          if (idHandling === 'generate') {
            toWrite.id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          }
          await db.collection(col).add(toWrite);
          report.added++;
        }
      } catch (e) {
        report.failed.push({ collection: col, id: p && p.id, error: String(e) });
      }
    }
  }
  return report;
}

exports.restore = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).send({ error: 'Method not allowed, use POST' });
    // Accept either a valid Firebase ID token in `Authorization: Bearer <token>`
    // with an `admin` custom claim, or the legacy BACKUP_SECRET header for automation.
    const authHeader = req.get('Authorization') || '';
    let isAdmin = false;
    if (authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split(' ')[1];
      try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        if (decoded && decoded.admin === true) isAdmin = true;
      } catch (e) {
        console.warn('ID token verification failed', e);
      }
    }

    const secret = req.get(SECRET_HEADER) || '';
    if (!isAdmin) {
      if (!process.env.BACKUP_SECRET) {
        console.warn('No BACKUP_SECRET configured and no valid admin token — deny request');
        return res.status(403).send({ error: 'Forbidden' });
      }
      if (secret !== process.env.BACKUP_SECRET) return res.status(403).send({ error: 'Forbidden' });
    }

    const mode = (req.query.mode || req.body.mode || 'merge');
    const payload = req.body.payload || req.body;
    if (!payload || typeof payload !== 'object') return res.status(400).send({ error: 'Invalid payload' });

    // 1. create pre-snapshot and capture id for response
    const current = await gatherExport();
    const pre = await savePreSnapshot(current);
    const preSnapshotId = pre && pre.id;

    if (mode === 'replace') {
      // delete existing
      const deletedCounts = {};
      for (const col of COLLECTIONS) {
        const c = await deleteAllInCollection(col);
        deletedCounts[col] = c;
      }
      // write new
      const addedCounts = {};
      addedCounts.menuItems = await writeDocsInBatches('menuItems', payload.items || []);
      addedCounts.categories = await writeDocsInBatches('categories', payload.categories || []);
      addedCounts.sections = await writeDocsInBatches('sections', payload.sections || []);
      addedCounts.profiles = await writeDocsInBatches('profiles', payload.profiles || []);
      addedCounts.roles = await writeDocsInBatches('roles', payload.roles || []);

      return res.send({ success: true, mode: 'replace', preSnapshotId, deletedCounts, addedCounts });
    }

    // default: merge
    // allow optional query params for conflictStrategy and idHandling
    const conflictStrategy = (req.query.conflictStrategy || req.body.conflictStrategy || 'merge');
    const idHandling = (req.query.idHandling || req.body.idHandling || 'preserve');
    const report = await mergePayload(payload, { conflictStrategy, idHandling });
    return res.send({ success: true, mode: 'merge', preSnapshotId, conflictStrategy, idHandling, report });
  } catch (e) {
    console.error('Restore function error', e);
    return res.status(500).send({ error: String(e) });
  }
});

// Scheduled backup: runs on BACKUP_CRON (cron expression) or defaults to daily at 03:00 UTC
exports.scheduledBackup = functions.pubsub.schedule(process.env.BACKUP_CRON || '0 3 * * *')
  .timeZone(process.env.TIME_ZONE || 'UTC')
  .onRun(async (context) => {
    try {
      console.log('Scheduled backup started');
      const payload = await gatherExport();
      // compute lightweight checksum (djb2)
      let checksum = '';
      try {
        const text = JSON.stringify(payload);
        let hash = 5381;
        for (let i = 0; i < text.length; i++) { hash = ((hash << 5) + hash) + text.charCodeAt(i); }
        checksum = (hash >>> 0).toString(16);
      } catch (e) { console.warn('Checksum failed', e); }

      const fileName = `backups/backup_${Date.now()}_${checksum || Math.random().toString(36).slice(2,8)}.json`;
      const bucket = admin.storage().bucket();
      const file = bucket.file(fileName);
      await file.save(Buffer.from(JSON.stringify(payload)), { contentType: 'application/json' });

      // Create signed URL (long expiration) for easy retrieval — change as needed
      let signedUrl = null;
      try {
        const [url] = await file.getSignedUrl({ action: 'read', expires: process.env.SIGNED_URL_EXPIRES || '2035-01-01' });
        signedUrl = url;
      } catch (e) { console.warn('Signed URL creation failed', e); }

      const meta = { version: payload.meta?.version || 'server-1.0.0', createdAt: Date.now(), fileName: fileName.split('/').pop() };
      await db.collection('backups').add({ meta, storagePath: fileName, fileUrl: signedUrl, sizeBytes: Buffer.byteLength(JSON.stringify(payload)), performedBy: 'scheduled-backup', createdAt: Date.now() });

      console.log('Scheduled backup finished', fileName);
      return null;
    } catch (e) {
      console.error('Scheduled backup error', e);
      return null;
    }
  });
