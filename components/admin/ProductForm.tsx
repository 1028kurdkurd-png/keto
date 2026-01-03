import React, { useState } from 'react';
import { Camera, Save, X, Globe, AlignLeft, DollarSign } from 'lucide-react';
import MediaLibrary from './MediaLibrary';
import { MenuItem, Category, Language } from '../../types';
import ImageCropper from './ImageCropper.tsx';

interface ProductFormProps {
    initialData?: Partial<MenuItem>;
    categories: Category[];
    onSubmit: (_item: MenuItem) => void;
    onCancel: () => void;
    defaultCategoryId?: string;
}

const ProductForm: React.FC<ProductFormProps> = ({ initialData, categories, onSubmit, onCancel, defaultCategoryId }) => {
    const [formData, setFormData] = useState<MenuItem>(() => ({
        id: initialData?.id || Date.now(),
        categoryId: initialData?.categoryId || defaultCategoryId || '',
        price: initialData?.price || 0,
        image: initialData?.image || '',
        emoji: initialData?.emoji || '',
        translations: initialData?.translations || {
            ku: { name: '', description: '', ingredients: '' },
            ar: { name: '', description: '', ingredients: '' },
            fa: { name: '', description: '', ingredients: '' },
            en: { name: '', description: '', ingredients: '' }
        }
    }));

    const [activeLang, setActiveLang] = useState<Language>('ku');
    const [showMediaLibrary, setShowMediaLibrary] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);



    const updateTranslation = (field: 'name' | 'description' | 'ingredients', value: string) => {
        setFormData(prev => ({
            ...prev,
            translations: {
                ...prev.translations,
                [activeLang]: {
                    ...prev.translations[activeLang],
                    [field]: value
                }
            }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.translations.ku.name || !formData.categoryId || formData.price <= 0) {
            alert('تکایە دڵنیابەرەوە لە پڕکردنەوەی ناوی کوردی، هاوپۆل و نرخ');
            return;
        }
        onSubmit(formData);
    };

    const languages: { code: Language; label: string }[] = [
        { code: 'ku', label: 'کوردی' },
        { code: 'ar', label: 'عربي' },
        { code: 'fa', label: 'فارسی' },
        { code: 'en', label: 'English' }
    ];

    return (
        <form onSubmit={handleSubmit} className="card overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-gray-50 border-b border-gray-100 p-6 flex justify-between items-center">
                <h2 className="text-xl font-black text-[#231f20]">زیادکردن / دەستکاریکردنی خواردن</h2>
                <button type="button" onClick={onCancel} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors">
                    <X size={24} />
                </button>
            </div>

            <div className="p-5 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Left Column: Image & Price */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500">وێنەی خواردن</label>
                        <div className="relative aspect-square rounded-[24px] bg-gray-50 border-2 border-dashed border-gray-200 hover:border-[#c68a53] transition-colors flex flex-col items-center justify-center overflow-hidden group cursor-pointer">
                            {formData.image ? (
                                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-gray-400 flex flex-col items-center gap-2">
                                    <Camera size={32} />
                                    <span className="text-xs font-bold">هەڵبژاردن لە فۆڵدەر</span>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => setShowMediaLibrary(true)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    {showMediaLibrary && (
                        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                            <div className="bg-white rounded-[30px] w-full max-w-4xl h-[80vh] shadow-2xl overflow-hidden relative">
                                <MediaLibrary
                                    isModal
                                    onClose={() => setShowMediaLibrary(false)}
                                    onSelect={(img) => {
                                        // setShowMediaLibrary(false);
                                        // setFormData(prev => ({ ...prev, image: img.data }));
                                        // BETTER: Open cropper for library images too!
                                        setShowMediaLibrary(false);
                                        setImageToCrop(img.data);
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {imageToCrop && (
                        <ImageCropper
                            imageSrc={imageToCrop}
                            aspect={1} // Force square crop
                            onCancel={() => setImageToCrop(null)}
                            onCropComplete={(croppedImg) => {
                                setFormData(prev => ({ ...prev, image: croppedImg }));
                                setImageToCrop(null);
                            }}
                        />
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500">نرخ (IQD)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={formData.price || ''}
                                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                className="w-full bg-gray-50 p-4 rounded-xl font-black text-lg text-[#231f20] focus:ring-2 ring-[#c68a53]/20 outline-none"
                                placeholder="0"
                            />
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500">هاوپۆل (Category)</label>
                        <select
                            value={formData.categoryId}
                            onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                            className="w-full bg-gray-50 p-4 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 ring-[#c68a53]/20"
                        >
                            <option value="">هاوپۆل هەڵبژێرە</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.translations.ku} / {c.translations.en}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Right Column: Multi-language details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Language Tabs */}
                    <div className="flex bg-gray-50 p-1.5 rounded-xl">
                        {languages.map(lang => (
                            <button
                                key={lang.code}
                                type="button"
                                onClick={() => setActiveLang(lang.code)}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${activeLang === lang.code
                                    ? 'bg-white text-[#c68a53] shadow-sm'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4 animate-in fade-in duration-300" key={activeLang}>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-500">
                                <Globe size={16} />
                                ناوی خواردن ({languages.find(l => l.code === activeLang)?.label})
                            </label>
                            <input
                                type="text"
                                value={formData.translations[activeLang].name}
                                onChange={e => updateTranslation('name', e.target.value)}
                                placeholder={`ناوی خواردن بە ${languages.find(l => l.code === activeLang)?.label}`}
                                className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-lg focus:ring-2 ring-[#c68a53]/20 outline-none"
                            />
                        </div>



                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-500">
                                <AlignLeft size={16} />
                                پێکهاتەکان ({languages.find(l => l.code === activeLang)?.label})
                            </label>
                            <textarea
                                rows={3}
                                value={formData.translations[activeLang].ingredients || ''}
                                onChange={e => updateTranslation('ingredients', e.target.value)}
                                placeholder="پێکهاتەکان..."
                                className="w-full bg-gray-50 p-4 rounded-2xl font-medium focus:ring-2 ring-[#c68a53]/20 outline-none resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500">Emoji (Optional)</label>
                            <input
                                type="text"
                                value={formData.emoji || ''}
                                onChange={e => setFormData({ ...formData, emoji: e.target.value })}
                                placeholder="🍔"
                                className="w-24 bg-gray-50 p-3 rounded-xl font-bold text-center outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 border-t border-gray-100 p-6 flex gap-4">
                <button type="submit" className="flex-1 btn-primary py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3">
                    <Save size={20} />
                    پاشکەوتکردن
                </button>
            </div>
        </form>
    );
};

export default ProductForm;
