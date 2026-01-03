import React from 'react';
import { Menu } from 'lucide-react';

export type AdminView =
    | 'admin_home'
    | 'admin_sections'      // Manage Sections (Main, Sweets, etc)
    | 'admin_categories'    // Manage Categories (Pizza, Burger)
    | 'admin_items'         // List Items
    | 'admin_items_by_category' // List Items (Context aware)
    | 'admin_upload'        // Add Item Wizard
    | 'admin_settings'
    | 'admin_media'         // Media Library
    | 'admin_profiles'      // Manage Profiles
    | 'admin_orders';       // Orders management (admin only)

import { TranslationStrings } from '../../types';
import { AdminSidebar } from './ui/AdminSidebar';

interface AdminLayoutProps {
    currentView: AdminView;
    onChangeView: (_view: AdminView) => void;
    onLogout: () => void;
    children: React.ReactNode;
    t: TranslationStrings;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ currentView, onChangeView, onLogout, children, t }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    return (
        <div className="min-h-screen bg-[#fcfbf9] flex text-right rtl" dir="rtl">
            <AdminSidebar
                currentView={currentView}
                onChangeView={onChangeView}
                onLogout={onLogout}
                t={t}
                isMobileOpen={isMobileMenuOpen}
                onCloseMobile={() => setIsMobileMenuOpen(false)}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
                {/* Mobile Header */}
                <header className="lg:hidden bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 flex justify-between items-center sticky top-0 z-30">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-primary hover:bg-gray-50 rounded-lg">
                        <Menu size={24} />
                    </button>
                    <span className="font-heading font-black text-primary">ADMIN PANEL</span>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-10 scroll-smooth">
                    <div className="max-w-7xl mx-auto h-full">
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
