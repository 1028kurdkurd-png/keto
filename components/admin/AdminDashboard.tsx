import React, { useMemo } from 'react';
import { Package, Layers, ShoppingBag, TrendingUp, Download, UploadCloud } from 'lucide-react';
import { MenuItem, Category, TranslationStrings } from '../../types';
import ProgressBar from '../common/ProgressBar';
import { menuService } from '../../services/menuService';
import AdminOrders from './AdminOrders';
import { autosave } from '../../services/autosave';
const ImportPreview = React.lazy(() => import('./ImportPreview'));
const AdminBackups = React.lazy(() => import('./AdminBackups'));

import { AdminStatsCard } from './ui/AdminStatsCard';

// ... imports

interface AdminDashboardProps {
    items: MenuItem[];
    categories: Category[];
    t: TranslationStrings;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ items, categories, t }) => {
    const stats = useMemo(() => [
        { label: t.totalItems, value: items.length, icon: Package, color: 'bg-blue-500' },
        { label: t.totalCategories, value: categories.length, icon: Layers, color: 'bg-purple-500' },
        { label: t.todaysOrders, value: '0', icon: ShoppingBag, color: 'bg-orange-500' }, // Placeholder
        { label: t.activity, value: 'Active', icon: TrendingUp, color: 'bg-green-500' },
    ], [items, categories, t]);

    const [isExporting, setIsExporting] = React.useState(false);
    const [exportProgress, setExportProgress] = React.useState<number | null>(null);
    const [showBackups, setShowBackups] = React.useState(false);
    const [autoCfg, setAutoCfg] = React.useState(() => autosave.getConfig());
    const [backupStatus, setBackupStatus] = React.useState<{ status: string; error?: string; meta?: any; timestamp?: number } | null>(() => {
        try { return JSON.parse(localStorage.getItem('mazen:autoBackup:status') || 'null'); } catch (e) { return null; }
    });

    React.useEffect(() => {
        const handler = (e: any) => setBackupStatus(e?.detail || null);
        window.addEventListener('mazin:backup', handler as EventListener);
        return () => window.removeEventListener('mazin:backup', handler as EventListener);
    }, []);

    const handleExport = async () => {
        if (isExporting) return null;
        setIsExporting(true);
        try {
            const payload = await menuService.exportData();
            const fileName = `backup_${new Date(payload.meta.createdAt).toISOString().replace(/[:.]/g, '-')}_v${payload.meta.version}.json`;
            payload.meta.fileName = fileName;
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

            // Upload to storage and save backup record (if possible)
            try {
                setExportProgress(0);
                const res: any = await menuService.saveBackupFile(payload, (pct) => setExportProgress(pct));
                const recId = await menuService.saveBackupRecord({ meta: payload.meta, performedBy: 'admin', fileUrl: res.url, storagePath: res.path, sizeBytes: res.sizeBytes });
                return { recordId: recId, fileUrl: res.url, storagePath: res.path } as any;
            } catch (e) {
                console.warn('Could not upload backup or save record', e);
                try { const recId = await menuService.saveBackupRecord({ meta: payload.meta, performedBy: 'admin' }); return { recordId: recId } as any; } catch (e2) { console.warn('Could not save backup record', e2); return null; }
            } finally { setExportProgress(null); }
        } catch (e) {
            console.error('Export failed', e);
            alert('Export failed: ' + String(e));
            return null;
        } finally {
            setIsExporting(false);
        }
    };

    const handleQuickExport = async () => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            const res = await handleExport();
            // If handleExport returned recordId, fetch it else find latest
            let record: any = null;
            if (res?.recordId) {
                const list = await menuService.listBackups();
                record = list.find((b: any) => b.id === res.recordId) || null;
            } else {
                const list = await menuService.listBackups();
                record = list.sort((a: any, b: any) => (b.meta?.createdAt || 0) - (a.meta?.createdAt || 0))[0] || null;
            }
            if (record) {
                alert('Export test complete. Backup record: ' + JSON.stringify({ id: record.id, fileUrl: record.fileUrl || record.storagePath || 'none', meta: record.meta }, null, 2));
            } else {
                alert('Export completed but no backup record found.');
            }
        } catch (e) {
            console.error('Quick export failed', e);
            alert('Quick export failed');
        } finally { setIsExporting(false); }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-black text-[#231f20]">{t.welcomeAdmin}</h1>
                    <p className="text-gray-500 font-medium">{t.dataSummary}</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="ml-4">
                        <button onClick={() => setShowBackups(s => !s)} className="px-4 py-2 bg-white border rounded">{showBackups ? 'Hide Backups' : 'Show Backups'}</button>
                    </div>
                    <div className="ml-4">
                        {exportProgress !== null ? (
                            <div className="space-y-2">
                                <div className="text-sm text-gray-500">Uploading backup</div>
                                <ProgressBar percent={exportProgress} height={8} />
                            </div>
                        ) : isExporting ? (
                            <div className="text-sm text-gray-500">Preparing backup...</div>
                        ) : null}
                    </div>
                </div>
            </div>

            {showBackups && (
                <div className="mt-6">
                    <React.Suspense fallback={<div className="text-sm text-gray-400">Loading backups...</div>}>
                        <AdminBackups />
                    </React.Suspense>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <AdminStatsCard
                        key={index}
                        title={stat.label}
                        value={stat.value}
                        icon={stat.icon}
                        color={stat.color}
                        trend={index === 0 ? '+5%' : undefined}
                        trendUp={true}
                    />
                ))}
            </div>

            {/* Recent Activity / Quick Tips */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[30px] shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg mb-4 text-[#231f20]">{t.quickTips}</h3>
                    <ul className="space-y-3 text-sm text-gray-500">
                        <li className="flex items-center gap-2">• {t.tipAdd}</li>
                        <li className="flex items-center gap-2">• {t.tipEdit}</li>
                        <li className="flex items-center gap-2">• {t.tipSave}</li>
                    </ul>
                </div>

                {/* Export / Import */}
                <div className="bg-white p-8 rounded-[30px] shadow-sm border border-gray-100 flex flex-col gap-4">
                    <h3 className="font-bold text-lg mb-2 text-[#231f20]">Export / Import</h3>
                    <p className="text-gray-500 text-sm mb-4">Download a full JSON backup of your menu and profiles, or restore from a JSON file.</p>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <button onClick={handleExport} disabled={isExporting || exportProgress !== null} className="flex items-center gap-2 px-4 py-3 bg-[#231f20] text-[#c68a53] rounded-xl font-bold disabled:opacity-60">
                                <Download /> Backup (Export)
                            </button>

                            <label className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl cursor-pointer">
                                <UploadCloud />
                                <input type="file" accept="application/json" onChange={async (e) => {
                                    const f = e.target.files?.[0];
                                    if (!f) return;
                                    try {
                                        const raw = await f.text();
                                        const parsed = JSON.parse(raw);
                                        if (!parsed.items || !parsed.categories || !parsed.sections) {
                                            if (!confirm('File does not look like a full export. Continue?')) return;
                                        }
                                        if (!confirm('Restoring will replace current menu, categories, sections and profiles. Proceed?')) return;
                                        // Create a pre-restore snapshot
                                        try { await menuService.preRestoreBackup(); } catch (e) { console.warn('Pre-restore snapshot failed', e); }
                                        // Use replaceFromExport to replace all data
                                        await menuService.replaceFromExport(parsed);
                                        alert('Restore completed.');
                                    } catch (err) {
                                        console.error(err);
                                        alert('Restore failed. See console for details.');
                                    }
                                }} style={{ display: 'none' }} />
                                Restore (Upload JSON)
                            </label>
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={Boolean(autoCfg.enabled)} onChange={(e) => { autosave.setConfig({ enabled: e.target.checked }); setAutoCfg(autosave.getConfig()); }} /> Auto-backup
                            </label>

                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={Boolean(autoCfg.upload)} onChange={(e) => { autosave.setConfig({ upload: e.target.checked }); setAutoCfg(autosave.getConfig()); }} /> Upload backups to cloud
                            </label>

                            <button onClick={async () => { await autosave.triggerNow(); alert('Auto-backup run requested'); }} className="ml-auto px-4 py-2 bg-white/10 rounded-lg">Run backup now</button>
                        </div>

                        <div className="text-xs text-gray-400">
                            <div>Last auto-backup: {autosave.lastRun() ? new Date(autosave.lastRun()!).toLocaleString() : 'Never'}</div>
                            <div className="mt-1 flex items-center gap-3">
                                <div className={`text-sm font-semibold ${backupStatus?.status === 'error' ? 'text-red-600' : backupStatus?.status === 'running' ? 'text-yellow-600' : 'text-green-600'}`}>
                                    {backupStatus ? `${backupStatus.status.toUpperCase()}${backupStatus.timestamp ? ' • ' + new Date(backupStatus.timestamp).toLocaleString() : ''}` : 'No status'}
                                </div>
                                {backupStatus?.error && <div className="text-xs text-red-500 truncate">Error: {backupStatus.error}</div>}
                                {backupStatus?.meta?.version && <div className="text-xs text-gray-400">v{backupStatus.meta.version}</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders */}
            <div className="mt-6 bg-white p-6 rounded-[30px] shadow-sm border border-gray-100">
                <AdminOrders menuItems={items} />
            </div>

            {/* Backup error toast */}
            {
                backupStatus?.status === 'error' && (
                    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full">
                        <div className="bg-white border border-red-200 shadow-md rounded-lg p-4 flex items-start gap-3">
                            <div className="flex-shrink-0 text-red-600 font-bold">Error</div>
                            <div className="flex-1">
                                <div className="text-sm text-gray-700 font-semibold">Auto-backup failed</div>
                                <div className="text-xs text-gray-500 mt-1 truncate">{backupStatus.error || 'Unknown error'}</div>
                                <div className="mt-2 flex items-center gap-2">
                                    <button onClick={() => { setShowBackups(true); }} className="px-3 py-1 bg-red-50 text-red-700 rounded text-xs">Open backups</button>
                                    <button onClick={async () => { await autosave.triggerNow(); alert('Auto-backup retried'); }} className="px-3 py-1 bg-white border rounded text-xs">Retry backup</button>
                                </div>
                            </div>
                            <button onClick={() => { try { localStorage.removeItem('mazen:autoBackup:status'); setBackupStatus(null); } catch (e) { } }} className="text-gray-400 ml-3">✕</button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AdminDashboard;
