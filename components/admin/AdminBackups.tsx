import React, { useEffect, useState } from 'react';
import { menuService } from '../../services/menuService';
import { auth } from '../../firebase';
import ProgressBar from '../common/ProgressBar';

const AdminBackups: React.FC = () => {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [actionProgressText, setActionProgressText] = useState<string | null>(null);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [localAutoMeta, setLocalAutoMeta] = useState<any | null>(() => {
    try { return JSON.parse(localStorage.getItem('mazen:latestAutoBackup') || 'null'); } catch (e) { return null; }
  });
  const [localAutoPayload, setLocalAutoPayload] = useState<any | null>(() => {
    try { return JSON.parse(localStorage.getItem('mazen:latestAutoBackupPayload') || 'null'); } catch (e) { return null; }
  });
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [preBackupEnabled, setPreBackupEnabled] = useState(true);
  const [lastPreSnapshot, setLastPreSnapshot] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [authenticating, setAuthenticating] = useState(false);
  const reauth = async () => {
    try {
      setAuthenticating(true);
      // Try popup sign-in (Google) — helper from firebase
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { reauthWithGoogle, auth } = require('../../firebase');
      await reauthWithGoogle();
      // check claims
      const user = auth.currentUser;
      if (user) {
        const tokenRes = await user.getIdTokenResult(true);
        setIsAdmin(!!(tokenRes.claims && tokenRes.claims.admin));
        if (!tokenRes.claims?.admin) alert('Signed in but admin claim not present');
      }
    } catch (e) {
      console.error('Reauth failed', e); alert('Re-authentication failed');
    } finally { setAuthenticating(false); }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const list = await menuService.listBackups();
      if (!mounted) return;
      setBackups(list.sort((a:any,b:any) => (b.meta?.createdAt || 0) - (a.meta?.createdAt||0)));
      setLoading(false);
    };
    load();

    const handler = () => {
      try {
        setLocalAutoMeta(JSON.parse(localStorage.getItem('mazen:latestAutoBackup') || 'null'));
        setLocalAutoPayload(JSON.parse(localStorage.getItem('mazen:latestAutoBackupPayload') || 'null'));
      } catch (e) { }
    };
    window.addEventListener('mazin:backup', handler);

    return () => { mounted = false; window.removeEventListener('mazin:backup', handler); };
  }, []);

  const download = async (b: any) => {
    try {
      if (b.fileUrl) { window.open(b.fileUrl, '_blank'); return; }
      const payload = b.payload || await menuService.getBackupPayload(b.id);
      if (!payload) { alert('No payload found'); return; }
      const fileName = b.meta?.fileName || `backup_${b.id}.json`;
      const text = JSON.stringify(payload, null, 2);
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed', e); alert('Download failed');
    }
  };

  const createBackup = async () => {
    if (!confirm('Create a new backup now?')) return;
    setCreatingBackup(true);
    setActionProgressText('Exporting data...');
    try {
      const payload = await menuService.exportData();
      setActionProgressText('Uploading backup file...');
      const uploadRes: any = await menuService.saveBackupFile(payload, (pct) => setDownloadProgress(pct));
      setActionProgressText('Saving backup record...');
      const rec: any = { meta: { version: payload.meta.version, createdAt: payload.meta.createdAt, fileName: uploadRes.path.split('/').pop() }, storagePath: uploadRes.path, fileUrl: uploadRes.url, sizeBytes: uploadRes.sizeBytes, performedBy: 'admin' };
      const id = await menuService.saveBackupRecord(rec);
      // Refresh list
      const list = await menuService.listBackups();
      setBackups(list.sort((a:any,b:any) => (b.meta?.createdAt || 0) - (a.meta?.createdAt||0)));
      alert('Backup created: ' + id);
    } catch (e) {
      console.error('Create backup failed', e);
      alert('Create backup failed');
    } finally {
      setCreatingBackup(false);
      setDownloadProgress(null);
      setActionProgressText(null);
    }
  };

  const createPreSnapshot = async () => {
    if (!confirm('Create a pre-restore snapshot (stored as a lightweight backup record)?')) return;
    setActionProgressText('Creating pre-restore snapshot...');
    try {
      const res: any = await menuService.preRestoreBackup();
      if (res && res.id) {
        setLastPreSnapshot({ id: res.id });
        // refresh list
        const list = await menuService.listBackups();
        setBackups(list.sort((a:any,b:any) => (b.meta?.createdAt || 0) - (a.meta?.createdAt||0)));
        alert('Pre-restore snapshot created: ' + res.id);
      } else {
        alert('Pre-restore snapshot created');
      }
    } catch (e) {
      console.error('Pre-snapshot failed', e);
      alert('Pre-snapshot failed');
    } finally {
      setActionProgressText(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const json = JSON.parse(text);
      if (!json || typeof json !== 'object') { alert('Invalid JSON'); return; }
      // Basic validation
      if (!json.meta || (!json.items && !json.categories && !json.sections && !json.profiles)) {
        if (!confirm('File does not look like a full export. Continue?')) return;
      }
      const mode = confirm('Import in REPLACE mode? OK = REPLACE, Cancel = MERGE') ? 'replace' : 'merge';
      if (mode === 'replace' && !confirm('REPLACE is destructive. Are you absolutely sure?')) return;
      if (preBackupEnabled) {
        setActionProgressText('Creating pre-restore snapshot...');
        try { await menuService.preRestoreBackup(); } catch (e) { console.warn('Pre-snapshot failed', e); }
      }
      setIsRestoring(true);
      setActionProgressText('Importing payload...');
      if (mode === 'replace') {
        const res = await menuService.replaceFromExport(json);
        if (res && res.success) alert('Replace successful'); else if (res && res.rolledBack) alert('Replace failed but rollback succeeded'); else alert('Replace failed');
      } else {
        const report = await menuService.restoreFromExport(json, { mode: 'merge' });
        alert('Merge complete');
        console.log('Merge report', report);
      }
    } catch (err) {
      console.error('Import failed', err);
      alert('Import failed: ' + String(err));
    } finally {
      setIsRestoring(false);
      setActionProgressText(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const preview = async (b: any) => {
    try {
      setActionProgressText('Downloading payload...');
      setDownloadProgress(0);
      const payload = b.payload || await menuService.getBackupPayload(b.id, (pct) => setDownloadProgress(pct));
      if (!payload) { alert('No payload'); setDownloadProgress(null); setActionProgressText(null); return; }
      setSelected({ ...b, payload });
    } catch (e) { console.error(e); alert('Failed to load payload'); }
    finally { setDownloadProgress(null); setActionProgressText(null); }
  };

  const applyMerge = async (b: any) => {
    if (!confirm('Apply merge? This will upsert items and may overwrite existing entries.')) return;
    setIsRestoring(true);
    setActionProgressText('Downloading payload for merge...');
    setDownloadProgress(0);
    try {
      const payload = b.payload || await menuService.getBackupPayload(b.id, (pct) => setDownloadProgress(pct));
      if (preBackupEnabled) {
        setActionProgressText('Creating pre-restore snapshot...');
        try { await menuService.preRestoreBackup(); } catch (e) { console.warn('Pre-snapshot failed', e); }
      }
      setActionProgressText('Applying merge...');
      const report = await menuService.restoreFromExport(payload, { mode: 'merge' });
      alert('Merge complete');
      console.log('Merge report', report);
    } catch (e) {
      console.error('Merge failed', e); alert('Merge failed');
    } finally { setIsRestoring(false); setDownloadProgress(null); setActionProgressText(null); }
  };

  const applyReplace = async (b: any) => {
    if (confirmText !== 'REPLACE') { alert('Type REPLACE to confirm'); return; }
    if (!confirm('This will replace entire menu data and is destructive. Continue?')) return;
    setIsRestoring(true);
    setActionProgressText('Downloading payload for replace...');
    setDownloadProgress(0);
    try {
      const payload = b.payload || await menuService.getBackupPayload(b.id, (pct) => setDownloadProgress(pct));
      if (preBackupEnabled) {
        setActionProgressText('Creating pre-restore snapshot...');
        try { await menuService.preRestoreBackup(); } catch (e) { console.warn('Pre-snapshot failed', e); }
      }
      setActionProgressText('Applying replace (this may take a while)...');
      const res = await menuService.replaceFromExport(payload);
      if (res && res.success) { alert('Replace successful'); }
      else if (res && res.rolledBack) { alert('Replace failed but rollback succeeded, check console'); }
      else { alert('Replace failed'); }
    } catch (e) { console.error('Replace failed', e); alert('Replace failed'); }
    finally { setIsRestoring(false); setConfirmText(''); setDownloadProgress(null); setActionProgressText(null); }
  };

  const serverRestore = async (b: any, mode: 'merge' | 'replace' = 'merge') => {
    if (mode === 'replace' && confirmText !== 'REPLACE') { alert('Type REPLACE to confirm'); return; }
    if (!confirm(`Trigger server-side ${mode} restore for ${b.id}?`)) return;
    setActionProgressText('Preparing payload...');
    setIsRestoring(true);
    try {
      const payload = b.payload || await menuService.getBackupPayload(b.id, (pct) => setDownloadProgress(pct));
      if (!payload) { alert('No payload'); return; }
      const user = auth.currentUser;
      if (!user) { alert('Not signed in. Re-auth and try again.'); return; }
      setActionProgressText('Getting auth token...');
      const token = await user.getIdToken(true);
      setActionProgressText('Calling server restore...');
      const url = (import.meta as any)?.env?.VITE_RESTORE_URL || '/__/functions/restore';
      const res = await fetch(url + '?mode=' + mode, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) { console.error('Server restore failed', json); alert('Server restore failed: ' + (json.error || res.status)); }
      else { alert('Server restore started: ' + JSON.stringify(json)); }
    } catch (e) { console.error('Server restore error', e); alert('Server restore error'); }
    finally { setIsRestoring(false); setActionProgressText(null); setDownloadProgress(null); }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h3 className="font-bold text-lg mb-3">Backups</h3>
      <div className="flex items-center gap-3 mb-3">
        <button onClick={createBackup} disabled={creatingBackup || isRestoring} className="px-3 py-1 bg-blue-600 text-white rounded">{creatingBackup ? 'Creating...' : 'Create Backup'}</button>
        <div className="flex items-center gap-3">
          <button onClick={createPreSnapshot} disabled={isRestoring} className="px-3 py-1 bg-yellow-500 text-white rounded">Create Pre-snapshot</button>
          {lastPreSnapshot && (
            <div className="text-xs text-gray-600">Last pre-snapshot: <code className="bg-white px-2 py-1 rounded">{lastPreSnapshot.id}</code></div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reauth} disabled={authenticating} className="px-3 py-1 bg-green-600 text-white rounded">{authenticating ? 'Auth...' : 'Re-auth (Admin)'}</button>
          <div className="text-xs text-gray-600">Admin: {isAdmin === null ? 'unknown' : isAdmin ? 'yes' : 'no'}</div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={preBackupEnabled} onChange={(e) => setPreBackupEnabled(e.target.checked)} />
          <span className="text-xs">Auto pre-restore snapshot</span>
        </label>
        <label className="px-3 py-1 bg-white border rounded cursor-pointer">
          Upload JSON
          <input ref={fileInputRef} onChange={handleFileUpload} type="file" accept=".json,application/json" className="hidden" />
        </label>

        {/* Local auto-backup (if present) */}
        {localAutoMeta && (
          <div className="p-3 border rounded bg-yellow-50 flex items-center justify-between w-full">
            <div>
              <div className="font-bold">Local Auto-backup {localAutoMeta?.meta?.version ? `• v${localAutoMeta.meta.version}` : ''}</div>
              <div className="text-xs text-gray-600">{localAutoMeta?.timestamp ? new Date(localAutoMeta.timestamp).toLocaleString() : ''}</div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => {
                if (!localAutoPayload) { alert('No local payload stored.'); return; }
                setSelected({ id: 'local', meta: localAutoPayload.meta, payload: localAutoPayload });
              }} className="px-3 py-1 bg-white border rounded">Preview</button>

              <button onClick={() => {
                if (!localAutoPayload) { alert('No local payload stored.'); return; }
                const p = localAutoPayload;
                const fileName = `local-auto-backup_${new Date(p.meta.createdAt).toISOString().replace(/[:.]/g,'-')}_v${p.meta.version}.json`;
                const text = JSON.stringify(p, null, 2);
                const blob = new Blob([text], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
              }} className="px-3 py-1 bg-white border rounded">Download</button>

              <button onClick={async () => {
                if (!localAutoPayload) { alert('No local payload stored.'); return; }
                if (!confirm('Restore from local auto-backup (REPLACE)? This will replace current menu.')) return;
                if (preBackupEnabled) { setActionProgressText('Creating pre-restore snapshot...'); try { await menuService.preRestoreBackup(); } catch(e) { console.warn('Pre-snapshot failed', e); } }
                setIsRestoring(true);
                try {
                  const res = await menuService.replaceFromExport(localAutoPayload);
                  if (res && res.success) alert('Replace successful'); else alert('Replace failed');
                } catch (e) { console.error('Restore failed', e); alert('Restore failed'); }
                finally { setIsRestoring(false); setActionProgressText(null); }
              }} className="px-3 py-1 bg-red-600 text-white rounded">Restore</button>
            </div>
          </div>
        )}

        {actionProgressText && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div>{actionProgressText}</div>
            <div style={{width:120}}><ProgressBar percent={downloadProgress ?? 0} /></div>
          </div>
        )}
      </div>
      {loading ? <div className="text-sm text-gray-500">Loading...</div> : (
        <div className="space-y-3">
          {backups.length === 0 ? <div className="text-gray-500">No backups found.</div> : (
            <div className="space-y-2">
              {backups.map(b => (
                <div key={b.id} className="p-3 border rounded flex items-center justify-between">
                  <div>
                    <div className="font-bold">{b.meta?.fileName || b.id} {b.fileUrl && <a href={b.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-green-600 ml-2">Open File</a>}</div>
                    <div className="text-sm text-gray-500">{b.performedBy || 'admin'} • {b.meta?.version} • {b.meta?.createdAt ? new Date(b.meta.createdAt).toLocaleString() : ''}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => preview(b)} disabled={downloadProgress !== null || isRestoring} className="px-3 py-1 bg-white border rounded disabled:opacity-50">Preview</button>
                    <button onClick={() => download(b)} disabled={downloadProgress !== null || isRestoring} className="px-3 py-1 bg-white border rounded disabled:opacity-50">Download</button>
                    <button onClick={() => applyMerge(b)} disabled={isRestoring || downloadProgress !== null} className="px-3 py-1 bg-[#231f20] text-[#c68a53] rounded disabled:opacity-50">Merge</button>
                    <button onClick={() => serverRestore(b, 'merge')} disabled={isRestoring || downloadProgress !== null} className="px-3 py-1 bg-[#1f6feb] text-white rounded disabled:opacity-50">Server Merge</button>
                    <button onClick={() => serverRestore(b, 'replace')} disabled={isRestoring || downloadProgress !== null} className="px-3 py-1 bg-red-700 text-white rounded disabled:opacity-50">Server Replace</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selected && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <h4 className="font-bold">Preview: {selected.meta?.fileName || selected.id}</h4>
          <div className="text-sm text-gray-700">Items: {(selected.payload?.items || []).length} • Categories: {(selected.payload?.categories || []).length} • Profiles: {(selected.payload?.profiles || []).length}</div>

          {actionProgressText && (
            <div className="mt-2">
              <div className="text-sm text-gray-600 mb-2">{actionProgressText}</div>
              <ProgressBar percent={downloadProgress ?? 0} />
            </div>
          )}

          <div className="mt-3">
            <div className="mb-2 text-xs text-gray-500">Type <code className="bg-white px-2 py-1 rounded">REPLACE</code> to enable destructive replace:</div>
            <div className="flex items-center gap-2">
              <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="p-2 rounded border w-48" placeholder="Type REPLACE to confirm" />
              <button disabled={isRestoring || confirmText !== 'REPLACE'} onClick={() => applyReplace(selected)} className="px-3 py-2 bg-red-600 text-white rounded">{isRestoring ? 'Replacing...' : 'Replace'}</button>
            </div>
            <div className="mt-3 text-xs text-gray-500">Preview payload (truncated):</div>
            <pre className="mt-2 max-h-60 overflow-auto text-xs bg-white p-2 border rounded">{JSON.stringify({ items: (selected.payload?.items || []).slice(0,10), categories: (selected.payload?.categories || []).slice(0,10) }, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBackups;
