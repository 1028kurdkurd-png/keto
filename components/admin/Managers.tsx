import React, { useState, useRef } from 'react';
import { Plus, Trash2, Download, Upload, Database, RefreshCw } from 'lucide-react';
import MediaLibrary from './MediaLibrary';
import { MenuItem, Category, Section, TranslationStrings, Profile } from '../../types';
import { menuService } from '../../services/menuService';

interface CategoryManagerProps {
    categories: Category[];
    sections?: Section[];
    onUpdate: (_id: string, _cat: Partial<Category>) => void;
    onAdd: (_cat: Category) => void;
    onDelete: (_id: string) => void;
    onBack?: () => void;
    onManageItems?: (_id: string) => void;
    items?: MenuItem[]; // For calculating counts
    t: TranslationStrings;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, sections, onUpdate, onAdd, onDelete, onBack, onManageItems, items = [], t }) => {
    const [mediaModalId, setMediaModalId] = useState<string | null>(null);

    const handleAddNew = () => {
        const newId = `cat_${Date.now()}`;
        onAdd({
            id: newId,
            sectionId: sections?.[0]?.id || 'main',
            image: '',
            isActive: true, // Default active
            translations: { ku: 'هاوپۆلی نوێ', ar: 'New', en: 'New', fa: 'New' }
        });
    };

    const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
        const sortedCategories = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));
        if (direction === 'up' && index > 0) {
            const current = sortedCategories[index];
            const prev = sortedCategories[index - 1];
            const tempOrder = current.order ?? index;
            const prevOrder = prev.order ?? (index - 1);
            onUpdate(current.id, { order: prevOrder });
            onUpdate(prev.id, { order: tempOrder });
        } else if (direction === 'down' && index < sortedCategories.length - 1) {
            const current = sortedCategories[index];
            const next = sortedCategories[index + 1];
            const tempOrder = current.order ?? index;
            const nextOrder = next.order ?? (index + 1);
            onUpdate(current.id, { order: nextOrder });
            onUpdate(next.id, { order: tempOrder });
        }
    };

    // Move to arbitrary position (0-based)
    const handleMoveTo = (fromIndex: number, toIndex: number) => {
        const sorted = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));
        if (toIndex < 0) toIndex = 0;
        if (toIndex >= sorted.length) toIndex = sorted.length - 1;
        const item = sorted.splice(fromIndex, 1)[0];
        sorted.splice(toIndex, 0, item);
        // Reassign orders sequentially
        sorted.forEach((c, i) => {
            const newOrder = i;
            if ((c.order ?? 0) !== newOrder) onUpdate(c.id, { order: newOrder });
        });
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            {onBack && (
                <button onClick={onBack} className="text-gray-500 hover:text-[#c68a53] flex items-center gap-2 font-bold mb-4">
                    <span className="text-2xl">←</span> {t.back}
                </button>
            )}
            <button onClick={handleAddNew} className="w-full py-4 btn-primary font-black flex items-center justify-center gap-2 shadow-lg hover:translate-y-[-2px] transition-all">
                <Plus /> {t.addItem}
            </button>

            <div className="grid grid-cols-1 gap-4">
                {[...categories].sort((a, b) => (a.order || 0) - (b.order || 0)).map((cat, idx) => {
                    const itemCount = items.filter(i => i.categoryId === cat.id).length;
                    return (
                        <div key={cat.id} className={`card p-6 ${cat.isActive === false ? 'border-red-100 bg-red-50/10' : ''} shadow-sm transition-all`}>
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="relative w-full md:w-32 h-32 bg-gray-50 rounded-2xl overflow-hidden group shrink-0">
                                    {cat.image ? <img src={cat.image} className={`w-full h-full object-cover ${!cat.isActive && 'grayscale'}`} /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">{t.noImages}</div>}
                                    <button
                                        onClick={() => setMediaModalId(cat.id)}
                                        className="absolute inset-0 bg-black/0 hover:bg-black/20 w-full h-full transition-colors cursor-pointer"
                                    />
                                    {/* Sort Buttons Overlay */}
                                    <div className="absolute top-2 left-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleMoveCategory(idx, 'up'); }}
                                            disabled={idx === 0}
                                            className="w-6 h-6 bg-white/30 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-[#c68a53] disabled:opacity-20"
                                        >
                                            ↑
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleMoveCategory(idx, 'down'); }}
                                            disabled={idx === categories.length - 1}
                                            className="w-6 h-6 bg-white/30 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-[#c68a53] disabled:opacity-20"
                                        >
                                            ↓
                                        </button>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] py-1 text-center font-bold pointer-events-none">{t.changeImage}</div>
                                </div>

                                <div className="flex-1 space-y-4 w-full">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-white bg-[#c68a53] px-2 py-1 rounded-lg shadow-sm">{itemCount} {t.itemsCount}</span>
                                            <label className="flex items-center gap-2 cursor-pointer bg-gray-100 px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={cat.isActive !== false}
                                                    onChange={(e) => onUpdate(cat.id, { isActive: e.target.checked })}
                                                    className="w-4 h-4 accent-[#c68a53]"
                                                />
                                                <span className={`text-xs font-bold ${cat.isActive !== false ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {cat.isActive !== false ? t.active : t.hidden}
                                                </span>
                                            </label>
                                        </div>
                                        <span className="text-[10px] text-gray-300 font-mono">{cat.id}</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input
                                            value={cat.translations.ku}
                                            onChange={(e) => onUpdate(cat.id, { translations: { ...cat.translations, ku: e.target.value } })}
                                            className="bg-gray-50 p-3 rounded-xl font-bold text-right outline-none focus:ring-1 ring-[#c68a53]" placeholder={t.kurdishName}
                                        />
                                        <input
                                            value={cat.translations.ar}
                                            onChange={(e) => onUpdate(cat.id, { translations: { ...cat.translations, ar: e.target.value } })}
                                            className="bg-gray-50 p-3 rounded-xl font-bold text-right outline-none focus:ring-1 ring-[#c68a53]" placeholder="Arabic"
                                        />
                                        <input
                                            value={cat.translations.fa}
                                            onChange={(e) => onUpdate(cat.id, { translations: { ...cat.translations, fa: e.target.value } })}
                                            className="bg-gray-50 p-3 rounded-xl font-bold text-right outline-none focus:ring-1 ring-[#c68a53]" placeholder="Farsi"
                                        />
                                        <input
                                            value={cat.translations.en}
                                            onChange={(e) => onUpdate(cat.id, { translations: { ...cat.translations, en: e.target.value } })}
                                            className="bg-gray-50 p-3 rounded-xl font-bold text-left ltr outline-none focus:ring-1 ring-[#c68a53]" placeholder={t.englishName}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-50">
                                        <select
                                            value={cat.sectionId}
                                            onChange={(e) => onUpdate(cat.id, { sectionId: e.target.value })}
                                            className="bg-gray-50 p-2 rounded-xl text-sm font-bold w-full sm:w-auto outline-none"
                                        >
                                            {sections?.map(s => (
                                                <option key={s.id} value={s.id}>{s.translations.ku} ({s.id})</option>
                                            )) || <option value="main">Main</option>}
                                        </select>

                                        {onManageItems && (
                                            <button
                                                onClick={() => onManageItems(cat.id)}
                                                className="flex-1 btn-primary px-4 py-2.5 text-sm font-bold flex items-center justify-center gap-2 shadow-md"
                                            >
                                                {t.manageFoods} ({itemCount})
                                            </button>
                                        )}

                                        <div className="flex items-center gap-3">
                                            <label className="text-xs text-gray-500">Position</label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={categories.length}
                                                value={idx + 1}
                                                onChange={(e) => {
                                                    const v = Number(e.target.value) - 1;
                                                    if (!Number.isNaN(v)) handleMoveTo(idx, v);
                                                }}
                                                className="w-16 bg-white border rounded px-2 py-1 text-sm"
                                            />
                                        </div>

                                        <button onClick={() => { if (confirm(t.deleteConfirm)) onDelete(cat.id) }} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                *** End Replace String(s) Successful.***
                {mediaModalId && (
                    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-[30px] w-full max-w-4xl h-[80vh] overflow-hidden relative shadow-2xl">
                            <MediaLibrary
                                isModal
                                onClose={() => setMediaModalId(null)}
                                onSelect={(img) => {
                                    onUpdate(mediaModalId, { image: img.data });
                                    setMediaModalId(null);
                                }}
                                t={t}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

interface SettingsManagerProps {
    settings: Record<string, any>;
    onUpdate: (_lang: string, _params: any) => void;
    t: TranslationStrings;
    items: MenuItem[];
    categories: Category[];
    sections: Section[];
    profiles: Profile[];
    roles: import('../../types').Role[];
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({ settings, onUpdate, t, items, categories, sections, profiles, roles }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isRestoring, setIsRestoring] = useState(false);

    const handleExport = () => {
        const data = {
            metadata: {
                version: '1.0',
                date: new Date().toISOString(),
                stats: {
                    items: items.length,
                    categories: categories.length,
                    sections: sections.length,
                    profiles: profiles.length,
                    roles: roles.length
                }
            },
            settings,
            sections,
            categories,
            items,
            profiles,
            roles
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `menu_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Safety: Require user to type "RESTORE" to prevent accidental data loss
        const confirmation = prompt(
            (t.deleteConfirm || "This will overwrite all current data. Are you sure?") +
            "\n\nType 'RESTORE' to confirm:"
        );

        if (confirmation !== 'RESTORE') {
            if (confirmation !== null) {
                alert("Restore cancelled. You must type 'RESTORE' to confirm.");
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsRestoring(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);

                // Validate basic structure (profiles might be optional for old backups, but checking others)
                if (!json.items || !json.categories || !json.sections) {
                    throw new Error("Invalid backup file format");
                }

                // 1. Restore Firestore Data
                await menuService.restoreData({
                    items: json.items,
                    categories: json.categories,
                    sections: json.sections,
                    profiles: json.profiles || [],
                    roles: json.roles || []
                });

                // 2. Restore Settings (Local State/Storage)
                if (json.settings) {
                    Object.keys(json.settings).forEach(lang => {
                        onUpdate(lang, json.settings[lang]);
                    });
                }

                alert("Data restored successfully!");
            } catch (err) {
                console.error(err);
                alert("Failed to restore data: " + err);
            } finally {
                setIsRestoring(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    console.log("Rendering SettingsManager", { items: items?.length, categories: categories?.length });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-gray-100 pb-6">
                <h2 className="text-3xl font-black text-[#231f20] flex items-center gap-3">
                    <Database className="text-[#c68a53]" />
                    {t?.settingsNavbar || "System Settings"}
                </h2>
                <p className="text-gray-500">Manage your restaurant information and data backups.</p>
            </div>

            {/* Restaurant Info Section */}
            <div className="card p-8">
                <h3 className="text-xl font-bold text-[#231f20] mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-[#231f20] rounded-full"></span>
                    {t?.restaurantInfo || "Restaurant Information"}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(['ku', 'en', 'ar', 'fa'] as const).map(lang => (
                        <div key={lang} className="p-5 border border-gray-100 rounded-2xl bg-gray-50/50 hover:bg-white hover:shadow-md transition-all">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-8 h-8 rounded-full bg-[#c68a53] text-white flex items-center justify-center text-xs font-black uppercase">
                                    {lang}
                                </span>
                                <span className="font-bold text-gray-400 uppercase tracking-wider text-xs">
                                    {lang === 'ku' ? 'Kurdish' : lang === 'en' ? 'English' : lang === 'ar' ? 'Arabic' : 'Persian'}
                                </span>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5 ml-1">Restaurant Name</label>
                                    <input
                                        value={settings[lang]?.restaurantName ?? ''}
                                        onChange={(e) => onUpdate(lang, { restaurantName: e.target.value })}
                                        placeholder={t?.restaurantName}
                                        className="w-full p-3.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#c68a53] focus:ring-4 ring-[#c68a53]/10 font-bold text-[#231f20] transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5 ml-1">Phone Number</label>
                                    <input
                                        value={settings[lang]?.phone ?? ''}
                                        onChange={(e) => onUpdate(lang, { phone: e.target.value })}
                                        placeholder={t?.phone}
                                        className="w-full p-3.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#c68a53] focus:ring-4 ring-[#c68a53]/10 font-bold text-[#231f20] transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Data Management Section */}
            <div className="bg-[#231f20] p-8 rounded-[30px] shadow-2xl relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#c68a53] rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
                    <span className="w-1.5 h-6 bg-[#c68a53] rounded-full"></span>
                    {t?.backupRestore || "Data Management"}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    {/* Export Card */}
                    <button
                        onClick={handleExport}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 p-6 rounded-2xl flex flex-col items-start gap-4 transition-all group text-left"
                    >
                        <div className="w-12 h-12 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Download size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-1">{t?.exportJSON || "Backup Data"}</h4>
                            <p className="text-sm text-gray-400">Download a complete JSON backup of your menu, categories, and settings.</p>
                        </div>
                        <div className="mt-auto pt-4 flex gap-4 text-xs font-mono text-gray-500">
                            <span>{items.length} Items</span>
                            <span>•</span>
                            <span>{categories.length} Categories</span>
                            <span>•</span>
                            <span>{profiles.length} Profiles</span>
                            <span>•</span>
                            <span>{roles.length} Roles</span>
                        </div>
                    </button>

                    {/* Import Card */}
                    <div className="bg-white/5 hover:bg-white/10 border border-white/10 p-6 rounded-2xl flex flex-col items-start gap-4 transition-all group relative">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            {isRestoring ? <RefreshCw className="animate-spin" size={24} /> : <Upload size={24} />}
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-1">{t?.importJSON || "Restore Data"}</h4>
                            <p className="text-sm text-gray-400">Restore your application data from a previously saved JSON file.</p>
                        </div>

                        <input
                            type="file"
                            accept=".json"
                            ref={fileInputRef}
                            onChange={handleImport}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isRestoring}
                        />

                        {isRestoring && (
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                                <span className="font-bold text-[#c68a53] animate-pulse">Restoring Data...</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 p-4 bg-orange-900/20 border border-orange-500/20 rounded-xl flex gap-3 items-start">
                    <Database className="text-orange-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-xs text-orange-200/80 leading-relaxed">
                        <strong>Warning:</strong> Restoring data will completely replace all existing sections, categories, and items with the data from the backup file. This action cannot be undone. Please ensure you have a current backup before restoring.
                    </p>
                </div>
            </div>
        </div>
    );
};
