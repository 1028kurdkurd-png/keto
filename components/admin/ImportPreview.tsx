import React, { useState } from 'react';
import Ajv from 'ajv';
import { menuService } from '../../services/menuService';
import schema from '../../schema/backup.schema.json';

const ajv = new Ajv();
const validate = ajv.compile(schema as any);

const ImportPreview: React.FC<{ onImported?: (_report: any) => void }> = ({ onImported }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [payload, setPayload] = useState<any | null>(null);
  const [errors, setErrors] = useState<string[] | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [replaceConfirm, setReplaceConfirm] = useState('');
  const [isReplacing, setIsReplacing] = useState(false);

  const handleFile = (f: File | null) => {
    setFileName(null); setPayload(null); setErrors(null); setSummary(null);
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = String(ev.target?.result || '');
        const data: any = JSON.parse(text);
        const ok = validate(data);
        if (!ok) {
          setErrors((validate.errors || []).map((e: any) => `${e.instancePath} ${e.message}`));
          return;
        }
        setFileName(f.name);
        setPayload(data);
        setErrors(null);

        // Build a simple summary
        const s = {
          items: (data as any).items?.length || 0,
          categories: (data as any).categories?.length || 0,
          sections: (data as any).sections?.length || 0,
          profiles: (data as any).profiles?.length || 0,
          roles: (data as any).roles?.length || 0,
        };
        setSummary(s);
      } catch (e: any) {
        setErrors([String(e.message || e)]);
      }
    };
    reader.readAsText(f);
  };

  const applyMerge = async () => {
    if (!payload) return;
    setIsApplying(true);
    try {
      const report = await menuService.restoreFromExport(payload, { mode: 'merge' });
      alert('Merge complete');
      if (onImported) onImported(report);
    } catch (e) {
      console.error('Import failed', e);
      alert('Import failed: ' + String(e));
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center gap-3">
        <input type="file" accept="application/json" onChange={(e) => handleFile(e.target.files ? e.target.files[0] : null)} />
        {fileName && <div className="text-sm text-gray-500">Loaded: {fileName}</div>}
      </div>

      {errors && (
        <div className="mt-3 p-3 bg-red-50 text-red-700 rounded">Errors:
          <ul className="list-disc pl-5">
            {errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      {summary && (
        <div className="mt-3">
          <h3 className="font-bold">Summary</h3>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="p-2 bg-gray-50 rounded">Items: <b>{summary.items}</b></div>
            <div className="p-2 bg-gray-50 rounded">Categories: <b>{summary.categories}</b></div>
            <div className="p-2 bg-gray-50 rounded">Sections: <b>{summary.sections}</b></div>
            <div className="p-2 bg-gray-50 rounded">Profiles: <b>{summary.profiles}</b></div>
            <div className="p-2 bg-gray-50 rounded">Roles: <b>{summary.roles}</b></div>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => alert('Dry-run preview: no changes applied.')} className="px-3 py-2 bg-white border rounded">Dry run</button>
              <button onClick={applyMerge} disabled={isApplying} className="px-3 py-2 bg-[#231f20] text-[#c68a53] rounded">{isApplying ? 'Applying...' : 'Merge (upsert)'}</button>
            </div>

            <div className="p-3 bg-red-50 border border-red-100 rounded">
              <div className="text-sm font-bold text-red-700 mb-2">Dangerous: Replace entire dataset</div>
              <div className="text-xs text-gray-500 mb-2">Typing <code className="bg-white px-2 py-1 rounded">REPLACE</code> below enables the destructive replace operation (pre-restore snapshot will be taken automatically).</div>
              <div className="flex items-center gap-2">
                <input value={replaceConfirm} onChange={(e) => setReplaceConfirm(e.target.value)} placeholder="Type REPLACE to confirm" className="p-2 rounded border w-48" />
                <button disabled={isReplacing || replaceConfirm !== 'REPLACE'} onClick={async () => {
                  if (!payload) return;
                  if (!confirm('This will replace all menu data. Are you sure?')) return;
                  setIsReplacing(true);
                  try {
                    const res = await menuService.replaceFromExport(payload);
                    if (res && res.success) {
                      alert('Replace successful');
                      if (onImported) onImported(res.report);
                    } else if (res && res.rolledBack) {
                      alert('Replace failed but rollback succeeded — check console for details');
                    } else {
                      alert('Replace failed — check console for details');
                    }
                  } catch (e) {
                    console.error('Replace failed', e);
                    alert('Replace failed: ' + String(e));
                  } finally {
                    setIsReplacing(false);
                    setReplaceConfirm('');
                  }
                }} className="px-3 py-2 bg-red-600 text-white rounded disabled:opacity-50">{isReplacing ? 'Replacing...' : 'Replace (destructive)'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportPreview;
