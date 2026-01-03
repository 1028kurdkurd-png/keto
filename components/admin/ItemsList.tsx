import React, { useState, useMemo } from 'react';
import { Search, Edit2, Trash2, Plus, ImageOff } from 'lucide-react';
import { MenuItem, Category, TranslationStrings } from '../../types';
import ProductForm from './ProductForm';
import { AdminDataTable, Column } from './ui/AdminDataTable';

interface ItemsListProps {
    items: MenuItem[];
    categories: Category[];
    onUpdate: (_id: number, _item: Partial<MenuItem>) => void;
    onDelete: (_id: number) => void;
    onAdd?: (_item: MenuItem) => void;
    categoryId?: string | null;
    onBack?: () => void;
    t: TranslationStrings;
}

const ItemsList: React.FC<ItemsListProps> = ({ items, categories, onUpdate, onDelete, onAdd, categoryId, onBack, t }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string>(categoryId || 'all');

    // Sync filter if categoryId prop changes
    React.useEffect(() => {
        if (categoryId) setFilterCategory(categoryId);
    }, [categoryId]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.translations.ku.name.includes(searchTerm) ||
                item.translations.en.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === 'all' || item.categoryId === filterCategory;
            return matchesSearch && matchesCategory;
        });
    }, [items, searchTerm, filterCategory]);

    const handleSave = (item: MenuItem) => {
        if (editingId) {
            onUpdate(editingId, item);
            setEditingId(null);
        }
    };

    if (isAdding && onAdd) {
        return (
            <div className="animate-in slide-in-from-right duration-300">
                <ProductForm
                    categories={categories}
                    defaultCategoryId={categoryId || undefined}
                    onSubmit={(item) => { onAdd(item); setIsAdding(false); }}
                    onCancel={() => setIsAdding(false)}
                />
            </div>
        );
    }

    if (editingId) {
        const itemToEdit = items.find(i => i.id === editingId);
        if (!itemToEdit) return null;
        return (
            <div className="animate-in slide-in-from-right duration-300">
                <ProductForm
                    initialData={itemToEdit}
                    categories={categories}
                    onSubmit={handleSave}
                    onCancel={() => setEditingId(null)}
                />
            </div>
        );
    }

    const columns: Column<MenuItem>[] = [
        {
            header: "Image",
            accessor: (item) => (
                <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden">
                    {item.image ? (
                        <img src={item.image} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageOff size={16} /></div>
                    )}
                </div>
            ),
            className: "w-20"
        },
        {
            header: t.itemName || "Name",
            accessor: (item) => (
                <div className="flex flex-col">
                    <span className="font-bold text-primary">{item.emoji} {item.translations.ku.name}</span>
                    <span className="text-xs text-gray-400">{item.translations.en.name}</span>
                </div>
            ),
            sortable: true
        },
        {
            header: t.categories || "Category",
            accessor: (item) => {
                const cat = categories.find(c => c.id === item.categoryId);
                return (
                    <span className="text-xs font-bold text-accent bg-orange-50 px-2 py-1 rounded-full whitespace-nowrap">
                        {cat?.translations.ku || 'N/A'}
                    </span>
                );
            },
            sortable: true
        },
        {
            header: t.itemPrice || "Price",
            accessor: (item) => (
                <span className="font-black text-gray-600 font-mono">
                    {item.price.toLocaleString()} <span className="text-[10px]">IQD</span>
                </span>
            ),
            sortable: true
        },
        {
            header: "Sort",
            accessor: (item) => (
                <div className="text-xs text-gray-300 font-mono">#{item.order || 0}</div>
            ),
            sortable: true,
            className: "w-16"
        }
    ];

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            {/* Header / Context Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-[24px] shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {onBack && (
                        <button onClick={onBack} className="text-gray-500 hover:text-[#c68a53] flex items-center gap-2 font-bold p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <span className="text-xl">←</span>
                        </button>
                    )}
                    <h2 className="text-xl font-black text-primary hidden md:block">{t.allItems || "Items"}</h2>
                </div>

                <div className="relative w-full md:w-96 group">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder={t.search}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-xl py-3 pr-12 pl-4 font-bold outline-none focus:ring-2 ring-[#c68a53]/20 transition-all"
                    />
                </div>

                <div className="flex w-full md:w-auto gap-2">
                    {!categoryId && (
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="w-full md:w-auto p-3 rounded-xl bg-gray-50 font-bold text-gray-600 outline-none border-r-[12px] border-r-transparent cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                            <option value="all">{t.categories}</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.translations.ku}</option>)}
                        </select>
                    )}

                    {onAdd && (
                        <button onClick={() => setIsAdding(true)} className="flex-shrink-0 px-6 py-3 bg-primary text-accent rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 shadow-lg active:scale-95 transition-all">
                            <Plus size={18} /> <span className="hidden sm:inline">{t.addItem}</span>
                        </button>
                    )}
                </div>
            </div>

            <AdminDataTable
                data={filteredItems}
                columns={columns}
                keyField="id"
                onRowClick={(item) => setEditingId(item.id)}
                actions={(item) => (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); setEditingId(item.id); }}
                            className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 transition-colors"
                            title={t.edit}
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); if (window.confirm(t.deleteConfirm)) onDelete(item.id); }}
                            className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                            title={t.delete}
                        >
                            <Trash2 size={16} />
                        </button>
                    </>
                )}
            />
        </div>
    );
};

export default ItemsList;
