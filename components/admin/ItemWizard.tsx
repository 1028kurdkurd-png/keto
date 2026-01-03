import React, { useState } from 'react';
import { ChevronRight, Utensils, Plus } from 'lucide-react';
import { Category, MenuItem, Section, TranslationStrings } from '../../types';
import MediaLibrary from './MediaLibrary';
import ProductForm from './ProductForm';

interface ItemWizardProps {
    categories: Category[];
    sections?: Section[];
    onSave: (_item: MenuItem) => void;
    onCancel: () => void;
    onAddCategory: (_cat: Category) => void;
    t: TranslationStrings;
}

const ItemWizard: React.FC<ItemWizardProps> = ({ categories, sections, onSave, onCancel, onAddCategory, t }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCatData, setNewCatData] = useState<Partial<Category>>({ translations: { ku: '', en: '', ar: '', fa: '' }, image: '' });
    const [showMediaLibrary, setShowMediaLibrary] = useState(false);

    const handleAddCategory = () => {
        if (!newCatData.translations?.ku || !newCatData.image) {
            alert(t.fillAllFields);
            return;
        }
        const newCat: Category = {
            id: `cat_${Date.now()}`,
            sectionId: selectedSectionId!,
            image: newCatData.image,
            translations: {
                ku: newCatData.translations.ku,
                en: newCatData.translations.en || newCatData.translations.ku,
                ar: newCatData.translations.ar || newCatData.translations.ku,
                fa: newCatData.translations.fa || newCatData.translations.ku
            }
        };
        onAddCategory(newCat);
        setSelectedCategoryId(newCat.id);
        setIsAddingCategory(false);
        setStep(3);
    };



    const filteredCategories = categories.filter(c => c.sectionId === selectedSectionId);

    if (step === 3 && selectedCategoryId) {
        return (
            <div className="animate-in slide-in-from-right duration-300">
                <div className="mb-6 flex items-center gap-2 text-gray-400 text-sm font-bold">
                    <button onClick={() => setStep(1)} className="hover:text-[#c68a53]">{t.backToHome}</button>
                    <ChevronRight size={14} className="rtl:rotate-180" />
                    <button onClick={() => setStep(2)} className="hover:text-[#c68a53]">
                        {/* Show selected section name */}
                        {sections?.find(s => s.id === selectedSectionId)?.translations.ku || selectedSectionId}
                    </button>
                    <ChevronRight size={14} className="rtl:rotate-180" />
                    <span className="text-[#c68a53]">{t.add}</span>
                </div>
                <ProductForm
                    initialData={{ categoryId: selectedCategoryId }}
                    defaultCategoryId={selectedCategoryId}
                    categories={categories}
                    onSubmit={onSave}
                    onCancel={onCancel}
                />
            </div>
        );
    }

    if (step === 2) {
        return (
            <div className="max-w-4xl mx-auto py-6 md:py-10 animate-in slide-in-from-right duration-300">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => setStep(1)} className="bg-gray-100 hover:bg-gray-200 p-3 rounded-full transition-colors">
                        <ChevronRight className="rtl:rotate-180" />
                    </button>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-[#231f20]">{t.selectCategory}</h2>
                        <p className="text-[#c68a53] font-bold text-sm">
                            {sections?.find(s => s.id === selectedSectionId)?.translations.en} / {sections?.find(s => s.id === selectedSectionId)?.translations.ku}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    {filteredCategories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => { setSelectedCategoryId(cat.id); setStep(3); }}
                            className="group relative h-40 rounded-[24px] overflow-hidden shadow-lg hover:shadow-xl transition-all active:scale-95"
                        >
                            <img src={cat.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                                <span className="text-white text-xl font-black uppercase tracking-wider text-shadow">{cat.translations.ku}</span>
                            </div>
                        </button>
                    ))}

                    {/* Add Category Button */}
                    <button
                        onClick={() => setIsAddingCategory(true)}
                        className="group relative h-40 rounded-[24px] border-4 border-dashed border-gray-200 hover:border-[#c68a53] flex flex-col items-center justify-center gap-2 hover:bg-orange-50 transition-all"
                    >
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-[#c68a53] group-hover:text-white transition-colors">
                            <Plus size={24} />
                        </div>
                        <span className="font-bold text-gray-400 group-hover:text-[#c68a53]">{t.addNewCategory}</span>
                    </button>

                    {isAddingCategory && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                            <div className="bg-white rounded-[30px] p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
                                <h3 className="text-xl font-black mb-4 text-[#231f20]">{t.createCategory}</h3>

                                <div className="space-y-4">
                                    <div className="h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 relative flex items-center justify-center overflow-hidden">
                                        {newCatData.image ? (
                                            <img src={newCatData.image} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-gray-400 text-sm font-bold">{t.chooseImage}</span>
                                        )}
                                        <button
                                            onClick={() => setShowMediaLibrary(true)}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        />
                                    </div>

                                    {showMediaLibrary && (
                                        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                                            <div className="bg-white rounded-[30px] w-full max-w-4xl h-[80vh] overflow-hidden relative shadow-2xl">
                                                <MediaLibrary
                                                    isModal
                                                    onClose={() => setShowMediaLibrary(false)}
                                                    onSelect={(img) => {
                                                        setNewCatData(prev => ({ ...prev, image: img.data }));
                                                        setShowMediaLibrary(false);
                                                    }}
                                                    t={t}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <input
                                        placeholder={t.kurdishName}
                                        value={newCatData.translations?.ku}
                                        onChange={e => setNewCatData(prev => ({ ...prev, translations: { ...prev.translations!, ku: e.target.value } }))}
                                        className="w-full bg-gray-50 p-3 rounded-xl font-bold outline-none ring-1 ring-transparent focus:ring-[#c68a53]/20"
                                    />

                                    <input
                                        placeholder={t.englishName}
                                        value={newCatData.translations?.en}
                                        onChange={e => setNewCatData(prev => ({ ...prev, translations: { ...prev.translations!, en: e.target.value } }))}
                                        className="w-full bg-gray-50 p-3 rounded-xl font-bold outline-none ring-1 ring-transparent focus:ring-[#c68a53]/20"
                                    />

                                    <div className="flex gap-3 pt-2">
                                        <button onClick={() => setIsAddingCategory(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl">{t.cancel}</button>
                                        <button onClick={handleAddCategory} className="flex-1 py-3 bg-[#231f20] text-[#c68a53] font-bold rounded-xl shadow-lg">{t.add}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Category Option could go here */}
                </div>
            </div>
        );
    }

    // Step 1: Section Selection
    return (
        <div className="max-w-4xl mx-auto py-6 md:py-10 animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-center text-2xl md:text-4xl font-black text-[#231f20] mb-2">{t.selectType}</h2>
            <p className="text-center text-gray-400 font-bold mb-8 md:mb-12 text-sm md:text-base">{t.typeQuestion}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 px-4 md:px-0">
                {sections?.map(section => (
                    <button
                        key={section.id}
                        onClick={() => { setSelectedSectionId(section.id); setStep(2); }}
                        className="group flex flex-col items-center gap-6 bg-white p-6 md:p-10 rounded-[40px] shadow-xl border border-gray-50 hover:border-[#c68a53]/30 transition-all hover:-translate-y-2"
                    >
                        <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center text-[#c68a53] group-hover:scale-110 transition-transform overflow-hidden">
                            {section.image ? (
                                <img src={section.image} className="w-full h-full object-cover" />
                            ) : (
                                <Utensils size={48} />
                            )}
                        </div>
                        <div className="text-center">
                            <h3 className="text-3xl font-black text-[#231f20] mb-2">{section.translations.ku}</h3>
                            <span className="text-gray-400 font-bold text-sm">{section.translations.en}</span>
                        </div>
                    </button>
                )) || <div>No sections found</div>}
            </div>
        </div>
    );
};

export default ItemWizard;
