import React from 'react';
import { MenuItem, Language } from '../../types';
import { Plus, Minus, ShoppingBag } from 'lucide-react';

interface MenuItemCardProps {
    item: MenuItem;
    lang: Language;
    cartQuantity: number;
    onAdd: () => void;
    onRemove: () => void;
    t: any;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, lang, cartQuantity, onAdd, onRemove, t }) => {
    const isRtl = lang !== 'en';

    return (
        <div className="group bg-white rounded-[24px] p-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-50 transition-all hover:shadow-[0_10px_30px_-10px_rgba(198,138,83,0.15)] hover:border-accent/20 flex gap-4 h-full">
            {/* Image */}
            <div className="w-28 h-28 md:w-32 md:h-32 shrink-0 rounded-2xl overflow-hidden bg-gray-50 relative">
                {item.image ? (
                    <img
                        src={item.image}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                        alt={item.translations[lang]?.name}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">🍕</div>
                )}
                {/* Badge if cart > 0 */}
                {cartQuantity > 0 && (
                    <div className="absolute top-2 left-2 bg-accent text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-md animate-scale-in">
                        {cartQuantity}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                    <h3 className="font-heading font-bold text-lg text-primary leading-tight mb-1">
                        {item.translations[lang]?.name}
                    </h3>
                    <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                        {item.translations[lang]?.description}
                    </p>
                </div>

                <div className="flex items-end justify-between mt-3">
                    <div className="text-lg font-black text-primary font-heading">
                        {Number(item.price).toLocaleString()} <span className="text-xs font-bold text-accent">IQD</span>
                    </div>

                    {/* Add/Remove Controls */}
                    {cartQuantity > 0 ? (
                        <div className="flex items-center bg-gray-100 rounded-xl p-1 shadow-inner gap-3">
                            <button onClick={onRemove} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-primary shadow-sm active:scale-90 transition-transform">
                                <Minus size={14} />
                            </button>
                            <span className="font-bold text-primary text-sm min-w-[10px] text-center">{cartQuantity}</span>
                            <button onClick={onAdd} className="w-7 h-7 flex items-center justify-center bg-primary text-accent rounded-lg shadow-lg active:scale-90 transition-transform">
                                <Plus size={14} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onAdd}
                            className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-primary hover:text-accent rounded-xl text-primary transition-all duration-300 active:scale-90"
                        >
                            <Plus size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
