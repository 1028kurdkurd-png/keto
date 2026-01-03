import React from 'react';
import { Category, Language } from '../../types';

interface CategoryCardProps {
    category: Category;
    onClick: () => void;
    lang: Language;
    t: any;
    itemCount: number;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onClick, lang, t, itemCount }) => {
    return (
        <button
            onClick={onClick}
            className="group relative w-full h-48 md:h-64 rounded-[32px] overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_40px_-15px_rgba(198,138,83,0.3)]"
        >
            {/* Image Background */}
            <div className="absolute inset-0 bg-gray-100">
                {category.image ? (
                    <img
                        src={category.image}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                        alt={category.translations[lang]}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                        <span className="text-4xl opacity-20">🍽️</span>
                    </div>
                )}
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

            {/* Content */}
            <div className="absolute inset-0 p-6 flex flex-col justify-end text-left items-start">
                <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <span className="inline-block px-3 py-1 mb-2 text-[10px] font-bold tracking-wider text-white uppercase bg-accent/90 backdrop-blur-sm rounded-full">
                        {itemCount} {t.items || 'Items'}
                    </span>
                    <h3 className="font-heading font-black text-2xl md:text-3xl text-white leading-tight mb-1">
                        {category.translations[lang]}
                    </h3>
                    <div className="h-1 w-0 group-hover:w-full bg-accent transition-all duration-500 rounded-full"></div>
                </div>
            </div>
        </button>
    );
};
