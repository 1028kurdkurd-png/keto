import { menuService } from './menuService';

export interface AutosaveConfig {
  enabled: boolean;
  upload: boolean; // whether to upload to storage using menuService.saveBackupFile
  debounceMs: number;
}

const STORAGE_KEY = 'mazen:autoBackupConfig';
let config: AutosaveConfig = { enabled: true, upload: true, debounceMs: 5000 };
let timer: any = null;
let lastRun: number | null = null;
let lastStatus: 'idle'|'running'|'success'|'error' = 'idle';
let lastError: string | null = null;

function setStatus(status: 'idle'|'running'|'success'|'error', err?: any, meta?: any) {
  lastStatus = status;
  lastError = err ? (err.message || String(err)) : null;
  try {
    localStorage.setItem('mazen:autoBackup:status', JSON.stringify({ status: lastStatus, error: lastError, timestamp: Date.now(), meta: meta || null }));
  } catch (e) {}
  try { window.dispatchEvent(new CustomEvent('mazin:backup', { detail: { status: lastStatus, error: lastError, meta } })); } catch(e) {}
}

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      config = { ...config, ...JSON.parse(raw) };
    }
  } catch (e) { console.warn('autosave: could not load config', e); }
}

function saveConfig() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch (e) { console.warn('autosave: could not save config', e); }
}

async function doBackup(reason = 'autosave') {
  try {
    setStatus('running');
    const payload = await menuService.exportData();
    lastRun = Date.now();
    // Always keep a copy in localStorage as fallback (meta + full payload)
    try {
      localStorage.setItem('mazen:latestAutoBackup', JSON.stringify({ meta: payload.meta, timestamp: Date.now() }));
      try { localStorage.setItem('mazen:latestAutoBackupPayload', JSON.stringify(payload)); } catch(e) { console.warn('autosave: could not store full payload locally', e); }
    } catch (e) { }

    if (config.upload) {
      try {
        const uploadRes: any = await menuService.saveBackupFile(payload);
        try { await menuService.saveBackupRecord({ meta: payload.meta, performedBy: 'auto-backup', fileUrl: uploadRes.url, storagePath: uploadRes.path, sizeBytes: uploadRes.sizeBytes }); } catch (e) { console.warn('autosave: saveBackupRecord failed', e); }
        setStatus('success', undefined, payload.meta);
      } catch (e) {
        console.warn('autosave: upload failed, falling back to local backup', e);
        // fallback: trigger a download for the user
        try {
          const fileName = `auto-backup_${new Date().toISOString().replace(/[:.]/g,'-')}_v${payload.meta.version}.json`;
          const text = JSON.stringify(payload, null, 2);
          const blob = new Blob([text], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          setStatus('success', undefined, payload.meta);
        } catch (e2) { console.warn('autosave: fallback download failed', e2); setStatus('error', e2); }
      }
    } else {
      // Not uploading; treat local snapshot as success
      setStatus('success', undefined, payload.meta);
    }
  } catch (e) {
    console.error('autosave: backup failed', e);
    setStatus('error', e);
  }
}

function scheduleBackup() {
  if (!config.enabled) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    doBackup('autosave-trigger');
  }, config.debounceMs);
}

function onUpdateEvent(e: any) {
  // Simple handler for CustomEvent with detail
  scheduleBackup();
}

export const autosave = {
  start: () => {
    loadConfig();
    window.addEventListener('mazin:update', onUpdateEvent as EventListener);
  },
  stop: () => {
    window.removeEventListener('mazin:update', onUpdateEvent as EventListener);
    if (timer) { clearTimeout(timer); timer = null; }
  },
  triggerNow: async () => {
    if (!config.enabled) return;
    if (timer) { clearTimeout(timer); timer = null; }
    await doBackup('manual');
  },
  setConfig: (c: Partial<AutosaveConfig>) => {
    config = { ...config, ...c };
    saveConfig();
  },
  getConfig: () => ({ ...config }),
  lastRun: () => lastRun,
};
