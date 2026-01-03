
import React, { useState } from 'react';
import { Section, Language } from '../../types';
import { Plus, Edit2, Trash2, Image } from 'lucide-react';
import MediaLibrary from './MediaLibrary';
import { TranslationStrings } from '../../types';

interface AdminSectionsProps {
    sections: Section[];
    onAdd: (_section: Section) => void;
    onUpdate: (_id: string, _section: Partial<Section>) => void;
    onDelete: (_id: string) => void;
    onSelect: (_id: string) => void;
    t: TranslationStrings;
}

const AdminSections: React.FC<AdminSectionsProps> = ({ sections, onAdd, onUpdate, onDelete, onSelect, t }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [openMedia, setOpenMedia] = useState(false);
    const [newSection, setNewSection] = useState<Partial<Section>>({
        translations: { ku: '', ar: '', fa: '', en: '' }
    });

    // For Editing
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleAdd = () => {
        if (!newSection.id || !newSection.image) {
            alert('Please fill ID and select Image');
            return;
        }
        onAdd(newSection as Section);
        setIsAdding(false);
        setNewSection({ translations: { ku: '', ar: '', fa: '', en: '' } });
    };


    const handleMove = (index: number, direction: 'up' | 'down') => {
        const newSections = [...sections];
        if (direction === 'up' && index > 0) {
            // Swap with previous
            const temp = newSections[index];
            newSections[index] = newSections[index - 1];
            newSections[index - 1] = temp;
        } else if (direction === 'down' && index < newSections.length - 1) {
            // Swap with next
            const temp = newSections[index];
            newSections[index] = newSections[index + 1];
            newSections[index + 1] = temp;
        } else {
            return;
        }

        // Update orders in DB
        // We assign order based on the new array index
        newSections.forEach((sec, idx) => {
            if (sec.order !== idx) {
                onUpdate(sec.id, { order: idx });
            }
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ... Header ... */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-[#231f20]">{t.sects.main} ({t.manageMenu})</h2>
                    <p className="text-gray-500 mt-1">{t.manageMenu}</p>
                </div>
                <button onClick={() => setIsAdding(true)} className="btn-primary flex items-center gap-2 px-6 py-3 font-bold">
                    <Plus size={20} />
                    {t.addItem}
                </button>
            </div>

            {isAdding && (
                <div className="card p-6 space-y-4">
                    <h3 className="text-xl font-bold text-[#231f20] mb-4">{t.createCategory}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            placeholder={t.sectionIdPlaceholder}
                            value={newSection.id || ''}
                            onChange={e => setNewSection({ ...newSection, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                            className="p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-[#c68a53]/20"
                        />
                        <div className="bg-gray-50 rounded-xl relative h-[60px] flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-[#c68a53] group cursor-pointer overflow-hidden">
                            {newSection.image ? (
                                <img src={newSection.image} className="w-full h-full object-cover opacity-50 group-hover:opacity-100" />
                            ) : (
                                <span className="text-gray-400 text-sm font-bold flex items-center gap-2"><Image size={16} /> {t.chooseImage}</span>
                            )}
                            <button onClick={() => setOpenMedia(true)} className="absolute inset-0 w-full h-full cursor-pointer bg-transparent" />
                        </div>
                    </div>
                    {openMedia && (
                        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                            <div className="bg-white rounded-[30px] w-full max-w-4xl h-[80vh] overflow-hidden relative shadow-2xl">
                                <MediaLibrary
                                    isModal
                                    onClose={() => setOpenMedia(false)}
                                    onSelect={(img) => {
                                        setNewSection(prev => ({ ...prev, image: img.data }));
                                        setOpenMedia(false);
                                    }}
                                    t={t}
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(['ku', 'ar', 'fa', 'en'] as Language[]).map(lang => (
                            <input
                                key={lang}
                                placeholder={`Name (${lang})`}
                                value={newSection.translations?.[lang] || ''}
                                onChange={e => setNewSection({
                                    ...newSection,
                                    translations: { ...newSection.translations!, [lang]: e.target.value }
                                })}
                                className="p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-[#c68a53]/20"
                            />
                        ))}
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button onClick={() => setIsAdding(false)} className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-100">{t.cancel}</button>
                        <button onClick={handleAdd} className="bg-[#231f20] text-[#c68a53] px-8 py-3 rounded-xl font-bold shadow-lg">{t.saveSection}</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map((section, idx) => (
                    <div key={section.id} className="group relative card hover:shadow-2xl transition-all duration-300 overflow-hidden">
                        <div className="h-40 w-full relative overflow-hidden">
                            <img src={section.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors"></div>

                            {/* Order Buttons */}
                            <div className="absolute top-4 left-4 flex flex-col gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleMove(idx, 'up'); }}
                                    disabled={idx === 0}
                                    className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-[#c68a53] disabled:opacity-30 disabled:hover:bg-white/20"
                                >
                                    ↑
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleMove(idx, 'down'); }}
                                    disabled={idx === sections.length - 1}
                                    className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-[#c68a53] disabled:opacity-30 disabled:hover:bg-white/20"
                                >
                                    ↓
                                </button>
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <h3 className="text-white text-3xl font-black uppercase drop-shadow-lg">{section.translations.ku}</h3>
                            </div>
                            {editingId === section.id && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 p-4 pointer-events-auto">
                                    <div className="bg-white rounded-xl p-4 w-full flex flex-col gap-2">
                                        <button
                                            onClick={() => {
                                                setNewSection(section);
                                                setOpenMedia(true);
                                                alert("To change image, delete and re-create or use the advanced edit below.");
                                            }}
                                            className="bg-[#231f20] text-white px-4 py-2 rounded-lg font-bold text-xs"
                                        >
                                            {t.changeImage}
                                        </button>
                                        <p className="text-[10px] text-gray-500 text-center">{t.deleteConfirm}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 flex flex-col gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-400 font-bold uppercase tracking-wider">
                                {editingId === section.id ? (
                                    <div className="grid grid-cols-2 gap-2 w-full">
                                        {(['ku', 'en', 'ar', 'fa'] as Language[]).map(l => (
                                            <input
                                                key={l}
                                                value={section.translations[l]}
                                                onChange={(e) => onUpdate(section.id, { translations: { ...section.translations, [l]: e.target.value } })}
                                                className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold w-full"
                                                placeholder={l}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-[#c68a53]"></span>
                                        {section.translations.en}
                                    </>
                                )}
                            </div>

                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={() => onSelect(section.id)}
                                    className="flex-1 bg-[#231f20] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#c68a53] transition-colors shadow-lg"
                                >
                                    {t.categories}
                                </button>
                                <button
                                    onClick={() => setEditingId(editingId === section.id ? null : section.id)}
                                    className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors ${editingId === section.id ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'}`}
                                >
                                    {editingId === section.id ? <Plus className="rotate-45" size={18} /> : <Edit2 size={18} />}
                                </button>
                                <button
                                    onClick={() => onDelete(section.id)}
                                    className="w-12 h-12 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminSections;
