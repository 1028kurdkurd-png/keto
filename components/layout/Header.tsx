import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Phone, ChevronDown, ShoppingBag, Search } from 'lucide-react';
import { Section, Language } from '../../types';

interface HeaderProps {
    view: string;
    onBack: () => void;
    logoPath: string;
    restaurantName: string;
    address: string;
    phone: string;
    sections: Section[];
    activeSectionId: string | null;
    onSectionChange: (id: string) => void;
    lang: Language;
    setLang: (l: Language) => void;
    t: any;
    cartCount?: number;
    onOpenCart?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    view,
    onBack,
    logoPath,
    restaurantName,
    address,
    phone,
    sections,
    activeSectionId,
    onSectionChange,
    lang,
    setLang,
    t,
    cartCount = 0,
    onOpenCart
}) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isRtl = lang !== 'en';

    return (
        <header className="relative z-30 mb-6">
            {/* Top Navigation Bar (Glass) */}
            <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-2' : 'bg-transparent py-4'}`}>
                <div className="container mx-auto px-4 flex items-center justify-between">
                    {/* Left/Start Action */}
                    <div className="flex items-center gap-2">
                        {view !== 'home' ? (
                            <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/20 text-[#c68a53] shadow-lg transition-transform active:scale-95">
                                <ArrowLeft size={20} className={isRtl ? 'rotate-180' : ''} />
                            </button>
                        ) : (
                            // Spacer or maybe a small logo when scrolled?
                            <div className={`transition-opacity duration-300 ${scrolled ? 'opacity-100' : 'opacity-0'}`}>
                                <span className="font-heading font-black text-lg text-primary">{restaurantName}</span>
                            </div>
                        )}
                    </div>

                    {/* Right/End Actions */}
                    <div className="flex items-center gap-3">
                        {/* Language Selector */}
                        <div className="relative group">
                            <select
                                value={lang}
                                onChange={(e) => setLang(e.target.value as Language)}
                                className="appearance-none bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-xs font-bold text-primary px-4 py-2 pr-8 rounded-full outline-none transition-all cursor-pointer"
                            >
                                <option value="en">ENG</option>
                                <option value="ku">کوردی</option>
                                <option value="ar">عربي</option>
                                <option value="fa">فارسی</option>
                            </select>
                            <ChevronDown size={14} className="absolute top-1/2 -translate-y-1/2 right-2.5 text-primary pointer-events-none" />
                        </div>

                        {/* Cart Button (Visible on scroll or always?) */}
                        {onOpenCart && (
                            <button onClick={onOpenCart} className="relative w-10 h-10 flex items-center justify-center rounded-full bg-primary text-accent shadow-lg active:scale-95 transition-transform">
                                <ShoppingBag size={18} />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="relative pt-24 pb-12 px-4 text-center overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-bg-main">
                    <div className="absolute -top-[50%] -left-[20%] w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,_var(--accent-light)_0%,_transparent_60%)] opacity-20 filter blur-[80px]"></div>
                </div>

                {/* Main Logo */}
                <div className="relative inline-block mb-6 animate-fade-up">
                    <div className="w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full p-1 bg-gradient-to-tr from-accent to-transparent shadow-2xl">
                        <div className="w-full h-full rounded-full bg-white p-1 overflow-hidden relative">
                            <img src={logoPath} className="w-full h-full object-cover rounded-full" alt="Logo" />
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="space-y-2 animate-fade-up delay-100">
                    <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tight">
                        {restaurantName}
                    </h1>

                    <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-text-muted mt-4">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-100 shadow-sm">
                            <MapPin size={14} className="text-accent" />
                            <span>{address}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-100 shadow-sm">
                            <Phone size={14} className="text-accent" />
                            <span dir="ltr">{phone}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section Tabs (Sticky) */}
            <div className="sticky top-14 z-40 bg-bg-main/95 backdrop-blur-xl border-b border-gray-100/50 shadow-sm">
                <div className="container mx-auto px-4 overflow-x-auto no-scrollbar py-3">
                    <div className="flex items-center gap-2 min-w-max mx-auto justify-center">
                        {sections.map(section => (
                            <button
                                key={section.id}
                                onClick={() => onSectionChange(section.id)}
                                className={`
                                    px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 
                                    ${activeSectionId === section.id
                                        ? 'bg-primary text-accent shadow-lg scale-105'
                                        : 'bg-white text-text-muted hover:bg-gray-50 border border-gray-100'}
                                `}
                            >
                                {section.translations[lang]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </header>
    );
};
