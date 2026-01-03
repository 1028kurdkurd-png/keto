import React, { useState } from 'react';
import {
    LayoutDashboard,
    Layers,
    List,
    PlusCircle,
    Settings,
    Image,
    User,
    ShoppingBag,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Store
} from 'lucide-react';
import { AdminView } from '../AdminLayout';

interface AdminSidebarProps {
    currentView: AdminView;
    onChangeView: (view: AdminView) => void;
    onLogout: () => void;
    t: any;
    isMobileOpen: boolean;
    onCloseMobile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
    currentView,
    onChangeView,
    onLogout,
    t,
    isMobileOpen,
    onCloseMobile
}) => {
    const [collapsed, setCollapsed] = useState(false);

    const NavItem = ({ view, icon: Icon, label, isAction = false }: { view: AdminView; icon: any; label: string, isAction?: boolean }) => {
        const isActive = currentView === view;
        return (
            <button
                onClick={() => {
                    onChangeView(view);
                    onCloseMobile();
                }}
                className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group
                    ${isActive
                        ? 'bg-gradient-to-tr from-primary to-primary-light text-accent shadow-lg shadow-black/10'
                        : 'text-gray-500 hover:bg-white hover:shadow-md hover:text-primary'
                    }
                    ${isAction ? 'mt-4 border border-dashed border-gray-200 hover:border-accent' : ''}
                `}
            >
                <div>
                    <Icon size={22} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                </div>
                {!collapsed && (
                    <span className={`font-bold text-sm whitespace-nowrap transition-all duration-300 ${isActive ? 'font-black' : ''}`}>
                        {label}
                    </span>
                )}
                {isActive && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                )}
            </button>
        );
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onCloseMobile}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
                fixed lg:static inset-y-0 right-0 z-50
                h-screen bg-[#fcfbf9] border-l border-gray-100/50 shadow-2xl lg:shadow-none
                flex flex-col transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                ${isMobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
                ${collapsed ? 'w-24' : 'w-72'}
            `}>
                {/* Branding / Toggle */}
                <div className="p-6 flex items-center justify-between border-b border-gray-100/50">
                    {!collapsed && (
                        <div className="flex items-center gap-2 animate-in fade-in duration-500">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-accent">
                                <Store size={18} />
                            </div>
                            <span className="font-heading font-black text-xl tracking-tight text-primary">ADMIN</span>
                        </div>
                    )}
                    {collapsed && (
                        <div className="w-full flex justify-center">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-accent">
                                <span className="font-black text-lg">A</span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden lg:flex w-8 h-8 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 hover:scale-105 active:scale-95 text-gray-400 hover:text-primary transition-all"
                    >
                        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                </div>

                {/* Nav Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                    <p className={`text-[10px] font-bold text-gray-300 uppercase tracking-widest px-4 mb-2 mt-2 ${collapsed ? 'text-center' : ''}`}>
                        {collapsed ? '●●●' : 'Main'}
                    </p>
                    <NavItem view="admin_home" icon={LayoutDashboard} label={t?.dashboard || "Dashboard"} />
                    <NavItem view="admin_orders" icon={ShoppingBag} label={t?.orders || 'Orders'} />

                    <p className={`text-[10px] font-bold text-gray-300 uppercase tracking-widest px-4 mb-2 mt-6 ${collapsed ? 'text-center' : ''}`}>
                        {collapsed ? '●●●' : 'Menu'}
                    </p>
                    <NavItem view="admin_sections" icon={Layers} label={t?.sectionsNavbar || "Sections"} />
                    <NavItem view="admin_categories" icon={List} label={t?.categories || "Categories"} />
                    <NavItem view="admin_items" icon={List} label={t?.allItems || "All Items"} />
                    <NavItem view="admin_upload" icon={PlusCircle} label={t?.addProduct || "Add Product"} isAction />

                    <p className={`text-[10px] font-bold text-gray-300 uppercase tracking-widest px-4 mb-2 mt-6 ${collapsed ? 'text-center' : ''}`}>
                        {collapsed ? '●●●' : 'Management'}
                    </p>
                    <NavItem view="admin_profiles" icon={User} label="Profiles" />
                    <NavItem view="admin_media" icon={Image} label={t?.mediaLibrary || "Media Library"} />
                    <NavItem view="admin_settings" icon={Settings} label={t?.settingsNavbar || "Settings"} />
                </div>

                {/* Logout */}
                <div className="p-4 border-t border-gray-100/50 bg-gray-50/50">
                    <button
                        onClick={onLogout}
                        className={`
                            w-full flex items-center gap-3 px-4 py-3 
                            text-red-500 bg-red-50 hover:bg-red-500 hover:text-white 
                            rounded-xl transition-all duration-300 font-bold shadow-sm hover:shadow-red-500/20
                            ${collapsed ? 'justify-center px-0' : ''}
                        `}
                    >
                        <LogOut size={20} />
                        {!collapsed && <span>{t?.logoutButton || "Logout"}</span>}
                    </button>
                </div>
            </aside>
        </>
    );
};
