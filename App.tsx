import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, MapPin, Phone, ArrowLeft, Plus, Minus, ShoppingBag, ChevronDown, WifiOff, Leaf, User, Mail, Facebook, Instagram, Video, MessageCircle } from 'lucide-react';
import { Language, CartItem, MenuItem, Category, Section, Profile, Role, Order } from './types';
import { TRANSLATIONS } from './constants';

// Admin Components
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminOrders from './components/admin/AdminOrders';
import ItemWizard from './components/admin/ItemWizard';
import ItemsList from './components/admin/ItemsList';
import AdminSections from './components/admin/AdminSections';
import { CategoryManager, SettingsManager } from './components/admin/Managers';
import { ProfileManager } from './components/admin/ProfileManager';
import MediaLibrary from './components/admin/MediaLibrary';
import { AdminView } from './components/admin/AdminLayout';
import { Header } from './components/layout/Header';
import { CategoryCard } from './components/ui/CategoryCard';
import { MenuItemCard } from './components/ui/MenuItemCard';
import SEO from './components/common/SEO';

import { menuService } from './services/menuService';
import { autosave } from './services/autosave';
// @ts-ignore
import { useRegisterSW } from 'virtual:pwa-register/react';

// Custom hook for Screen Wake Lock
const useWakeLock = () => {
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('Wake Lock active');
        }
      } catch (err) {
        console.error('Wake Lock failed:', err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    requestWakeLock();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) wakeLock.release();
    };
  }, []);
};

const App: React.FC = () => {
  // --- CORE STATE ---
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('mazin_lang') as Language) || 'ku');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [view, setView] = useState<'home' | 'items' | 'cart' | 'admin_login' | 'admin_dashboard' | 'profiles' | 'profile_details'>('home');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [adminView, setAdminView] = useState<AdminView>('admin_home');

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [adminSelectedSectionId, setAdminSelectedSectionId] = useState<string | null>(null);
  const [adminSelectedCategoryId, setAdminSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLogoZoomed, setIsLogoZoomed] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem('mazin_cart');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  const [deviceId] = useState<string>(() => {
    try {
      let id = localStorage.getItem('mazin_device_id');
      if (!id) {
        id = (crypto as any).randomUUID ? (crypto as any).randomUUID() : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        localStorage.setItem('mazin_device_id', id);
      }
      return id;
    } catch (e) {
      return `dev-${Date.now()}`;
    }
  });

  const [showOrders, setShowOrders] = useState(false);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [password, setPassword] = useState('');
  const [, setIsAdmin] = useState(false);
  // Professional Features
  useWakeLock();

  // Auto-update logic
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error);
    },
  });

  // Automatically update when ready (Professional Kiosk Mode)
  useEffect(() => {
    if (needRefresh) {
      console.log("New content available, auto-reloading...");
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);

  // Recovery / Auto-fix state
  const [recoveryState, setRecoveryState] = useState<{ status: 'idle' | 'trying' | 'success' | 'failed'; attempts: number; message?: string }>({ status: 'idle', attempts: 0 });
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingOutbox, setPendingOutbox] = useState<number>(0);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      // Try to flush outbox when we come online
      try {
        const { processOutbox, outboxCount } = await import('./src/utils/offlineOutbox' as any);
        const handlers: Record<string, any> = {
          backupFile: async ({ payload, meta }: any) => {
            try {
              const res: any = await menuService.saveBackupFile(payload);
              if (res && (res as any).queued) return false; // still queued
              await menuService.saveBackupRecord({ meta, performedBy: 'auto-sync', fileUrl: res.url, storagePath: res.path, sizeBytes: res.sizeBytes });
              return true;
            } catch (err) {
              console.warn('Outbox backup sync failed', err);
              return false;
            }
          }
        };

        await processOutbox(handlers);
        const count = await outboxCount();
        setPendingOutbox(count);
      } catch (e) {
        console.warn('Failed to process outbox', e);
      }
    };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also check pending outbox on mount
    (async () => {
      try {
        const { outboxCount } = await import('./src/utils/offlineOutbox' as any);
        setPendingOutbox(await outboxCount());
      } catch (e) {
        console.warn('Failed to read outbox count on startup', e);
      }
    })();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- DATA STATE (FIRESTORE SYNCED) ---
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [appSettings, setAppSettings] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem('mazin_app_settings');
    return saved ? JSON.parse(saved) : {};
  });

  // --- EFFECT: FIRESTORE SUBSCRIPTIONS ---
  useEffect(() => {
    // 1. Initialize DB if empty
    menuService.initializeData();

    // 2. Subscribe
    const unsubItems = menuService.subscribeToItems(setMenuItems);
    const unsubCats = menuService.subscribeToCategories(setCategories);
    const unsubSecs = menuService.subscribeToSections((secs) => {
      setSections(secs);
      // Default to first section if none selected
      if (!activeSectionId && secs.length > 0) {
        setActiveSectionId(secs[0].id);
      } else if (activeSectionId && secs.length > 0) {
        // Check if active section still exists? If not, reset.
        const exists = secs.find(s => s.id === activeSectionId);
        if (!exists) setActiveSectionId(secs[0].id);
      }
    });
    const unsubProfiles = menuService.subscribeToProfiles(setProfiles);
    const unsubRoles = menuService.subscribeToRoles(setRoles);

    return () => {
      unsubItems();
      unsubCats();
      unsubSecs();
      unsubSecs();
      unsubProfiles();
      unsubRoles();
    };
  }, []); // Remove dependency on activeSectionId to avoid loops, or careful dependency management.
  // Actually, we need to be careful. The callback to subscribeToSections runs whenever sections update.
  // We should just update `sections` state, and have another effect set the default if needed.
  // BUT here I put logic inside the callback for simplicity in one go.
  // Note: `activeSectionId` inside the callback will be stale (closure).
  // Better approach: Use a separate effect.

  useEffect(() => {
    if (!activeSectionId && sections.length > 0) {
      setActiveSectionId(sections[0].id);
    }
  }, [sections, activeSectionId]);

  // --- REVIEW STATE ---
  const [previewItem, setPreviewItem] = useState<MenuItem | null>(null);

  // --- EFFECT: PERSISTENCE (SETTINGS ONLY) ---
  useEffect(() => { localStorage.setItem('mazin_app_settings', JSON.stringify(appSettings)); }, [appSettings]);

  // Persist cart locally so user changes survive refresh
  useEffect(() => {
    try { localStorage.setItem('mazin_cart', JSON.stringify(cart)); } catch (e) { /* ignore */ }
  }, [cart]);

  // Persist language selection
  useEffect(() => {
    try { localStorage.setItem('mazin_lang', lang); } catch (e) { /* ignore */ }
  }, [lang]);

  // Start autosave service to listen for changes and perform backups
  useEffect(() => {
    try {
      autosave.start();
    } catch (e) { console.warn('Failed to start autosave', e); }
    return () => { try { autosave.stop(); } catch (e) { } };
  }, []);

  // Auto-load user's orders when opening the cart
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (view === 'cart') {
          const my = await menuService.fetchOrdersByDevice(deviceId);
          if (!cancelled) {
            setUserOrders(my as any);
            setShowOrders(true);
          }
        }
      } catch (e) {
        console.error('Failed to fetch orders by device', e);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [view, deviceId]);

  // Global runtime error handler + auto-recovery attempts
  const recoverFromError = useCallback(async (err: any) => {
    console.warn('Attempting automatic recovery from error:', err);
    setRecoveryState({ status: 'trying', attempts: 0, message: String(err?.message || err) });
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts += 1;
      setRecoveryState({ status: 'trying', attempts, message: `Attempt ${attempts}` });
      try {
        // Try to re-fetch core collections and re-populate state
        const [items, cats, secs, profs, roles] = await Promise.all([
          menuService.fetchItems(),
          menuService.fetchCategories(),
          menuService.fetchSections(),
          menuService.fetchProfiles(),
          menuService.fetchRoles()
        ]);
        setMenuItems(items);
        setCategories(cats);
        setSections(secs);
        setProfiles(profs);
        setRoles(roles);

        setRecoveryState({ status: 'success', attempts, message: 'Recovered' });
        console.info('Recovery successful');
        // brief visibility of success, then reset
        setTimeout(() => setRecoveryState({ status: 'idle', attempts: 0 }), 1500);
        return;
      } catch (e) {
        console.warn('Recovery attempt failed', attempts, e);
        // Exponential backoff before retrying
        await new Promise(r => setTimeout(r, 1000 * attempts));
      }
    }

    // final fallback: reload page to get fresh state
    setRecoveryState({ status: 'failed', attempts, message: 'Reloading' });
    setTimeout(() => window.location.reload(), 2000);
  }, []);

  useEffect(() => {
    const onError = (ev: ErrorEvent) => {
      try {
        recoverFromError(ev.error || ev.message || 'Unknown error');
      } catch (e) {
        console.error('Recovery handler failed', e);
      }
    };
    const onRejection = (ev: PromiseRejectionEvent) => {
      try {
        recoverFromError(ev.reason || 'Unhandled rejection');
      } catch (e) {
        console.error('Recovery handler failed', e);
      }
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection as any);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection as any);
    };
  }, [recoverFromError]);

  // --- EFFECT: URL CHECK (ADMIN) ---
  useEffect(() => {
    const checkUrl = () => {
      const url = window.location.href;
      if (url.endsWith('admin2001') || url.endsWith('admin2001/')) {
        setView('admin_login');
        window.history.replaceState({}, '', window.location.pathname.replace(/\/admin2001\/?$/, ''));
      }
    };
    checkUrl();
  }, []);

  // --- LIVE UPDATE HANDLER: respond to 'mazin:update' events ---
  // --- LIVE UPDATE HANDLER ---
  // REMOVED: efficient Firestore subscriptions (onSnapshot) handle all real-time updates automatically.
  // Manual re-fetching via 'mazin:update' is redundant and slower.

  // --- ACTIONS ---
  const handleAdminLogin = () => {
    const expected = (import.meta as any).env?.VITE_ADMIN_PASSWORD || 'keto55';
    if (password === expected) {
      setIsAdmin(true);
      setView('admin_dashboard');
    } else {
      alert(t.adminLoginError);
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setView('home');
    setPassword('');
  };

  const updateItem = (id: number, patch: Partial<MenuItem>) => {
    menuService.updateItem(id, patch);
  };

  const addItem = async (item: MenuItem) => {
    try {
      const newItem = { ...item, id: Date.now() };
      await menuService.addItem(newItem);

      // Construct detailed message
      const cat = categories.find(c => c.id === item.categoryId);
      const sec = sections.find(s => s.id === cat?.sectionId);
      const itemName = item.translations[lang]?.name || 'Item';
      const catName = cat?.translations[lang] || 'Category';
      const secName = sec?.translations[lang] || 'Section';

      alert(`${t.itemAdded}\n"${itemName}" -> ${catName} (${secName})`);
      setAdminView('admin_items');
    } catch (e) {
      console.error("Failed to add item", e);
      alert("Failed to add item: " + String(e));
    }
  };

  const deleteItem = (id: number) => {
    if (confirm(t.deleteConfirm)) {
      menuService.deleteItem(id);
    }
  };


  const handleDeleteRole = async (id: string) => {
    await menuService.deleteRole(id);
  };

  const handleAddRole = async (names: { ku: string, ar: string, fa: string, en: string }) => {
    const defaultName = names.en || names.ku || 'New Role';
    // Use timestamp to avoid duplicates if name is same
    const id = defaultName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    await menuService.addRole({
      id,
      name: defaultName,
      translations: names,
      order: roles.length
    });
  };

  const handleUpdateRole = async (id: string, updates: Partial<Role>) => {
    await menuService.updateRole(id, updates);
  };

  const handleMoveRole = async (id: string, direction: 'up' | 'down') => {
    const sortedRoles = [...roles].sort((a, b) => (a.order || 0) - (b.order || 0));
    const index = sortedRoles.findIndex(r => r.id === id);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const prev = sortedRoles[index - 1];
      const curr = sortedRoles[index];
      const tempOrder = prev.order ?? (index - 1);
      const currOrder = curr.order ?? index;
      // Swap explicit orders
      await menuService.updateRole(curr.id, { order: tempOrder });
      await menuService.updateRole(prev.id, { order: currOrder });
    } else if (direction === 'down' && index < sortedRoles.length - 1) {
      const next = sortedRoles[index + 1];
      const curr = sortedRoles[index];
      const tempOrder = next.order ?? (index + 1);
      const currOrder = curr.order ?? index;
      await menuService.updateRole(curr.id, { order: tempOrder });
      await menuService.updateRole(next.id, { order: currOrder });
    }
  };

  const handleLogoClick = () => {
    setIsLogoZoomed(true);
    setTimeout(() => setIsLogoZoomed(false), 1000);
  };

  // --- HELPERS ---
  const baseUrl = (import.meta as any).env?.BASE_URL || '/';
  const logoPath = `${baseUrl}mazinlogo.jpeg`.replace('//', '/');

  const baseT = TRANSLATIONS[lang];
  const t = { ...baseT, ...(appSettings[lang] || {}) } as typeof baseT;
  const isRtl = lang !== 'en';

  const filteredCategories = useMemo(() => categories.filter(c => c.sectionId === activeSectionId && c.isActive !== false), [activeSectionId, categories]);
  const currentCategory = useMemo(() => categories.find(c => c.id === selectedCategoryId), [selectedCategoryId, categories]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return menuItems.filter(item => {
      const matchesCategory = selectedCategoryId ? item.categoryId === selectedCategoryId : true;
      if (!matchesCategory) return false;
      if (!query) return true;
      return item.translations[lang]?.name?.toLowerCase().includes(query);
    });
  }, [lang, selectedCategoryId, searchQuery, menuItems]);

  // Ensure 'Main' section appears before 'Dessert' where both exist (matching by common keywords in any translation)
  const displaySections = useMemo(() => {
    if (!sections || sections.length === 0) return sections;
    const findByKeywords = (s: Section, keywords: string[]) => {
      return Object.values(s.translations).some((v: any) => {
        if (!v) return false;
        const low = (typeof v === 'string' ? v : '').toLowerCase();
        return keywords.some(k => low.includes(k));
      });
    };
    const dessertKeywords = ['dessert', 'شیر', 'شیرینی', 'desserts', 'sweet'];
    const mainKeywords = ['main', 'سەرەکی', 'سەر'];
    const idxDessert = sections.findIndex(s => findByKeywords(s, dessertKeywords));
    const idxMain = sections.findIndex(s => findByKeywords(s, mainKeywords));
    if (idxDessert === -1 || idxMain === -1) return sections;
    // If Main is already before Dessert, leave as-is
    if (idxMain < idxDessert) return sections;
    const mainSec = sections[idxMain];
    const dessertSec = sections[idxDessert];
    const others = sections.filter(s => s.id !== mainSec.id && s.id !== dessertSec.id);
    const insertPos = Math.min(idxMain, idxDessert);
    const result = [...others.slice(0, insertPos), mainSec, dessertSec, ...others.slice(insertPos)];
    return result;
  }, [sections]);

  const addToCart = useCallback((id: number) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.id === id);
      if (idx > -1) {
        const newCart = [...prev];
        newCart[idx] = { ...newCart[idx], quantity: newCart[idx].quantity + 1 };
        return newCart;
      }
      return [...prev, { id, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id: number) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.id === id);
      if (idx === -1) return prev;
      if (prev[idx].quantity === 1) return prev.filter(item => item.id !== id);
      const newCart = [...prev];
      newCart[idx] = { ...newCart[idx], quantity: newCart[idx].quantity - 1 };
      return newCart;
    });
  }, []);

  const placeOrder = useCallback(async (note?: string) => {
    if (cart.length === 0) {
      alert(t.emptyBasket);
      return;
    }
    const total = cart.reduce((acc, curr) => acc + (menuItems.find(i => i.id === curr.id)?.price || 0) * curr.quantity, 0);
    try {
      await menuService.placeOrder({ items: cart, total, deviceId, status: 'new', createdAt: Date.now(), customerNote: note || '' });
      setCart([]);
      alert(t.orderPlaced || 'Order placed successfully');
      setView('home');
    } catch (e) {
      console.error(e);
      alert('Order failed.');
    }
  }, [cart, deviceId, menuItems, t]);

  // Manual sync trigger
  const manualSync = async () => {
    try {
      const { processOutbox, outboxCount } = await import('./src/utils/offlineOutbox' as any);
      const handlers: Record<string, any> = {
        backupFile: async ({ payload, meta }: any) => {
          try {
            const res: any = await menuService.saveBackupFile(payload);
            if (res && (res as any).queued) return false;
            await menuService.saveBackupRecord({ meta, performedBy: 'manual-sync', fileUrl: res.url, storagePath: res.path, sizeBytes: res.sizeBytes });
            return true;
          } catch (err) {
            console.warn('Outbox backup sync failed', err);
            return false;
          }
        }
      };
      await processOutbox(handlers);
      setPendingOutbox(await outboxCount());
      alert('Sync attempt complete');
    } catch (e) {
      console.error('Manual sync failed', e);
      alert('Manual sync failed: ' + String(e));
    }
  };

  // --- RENDER: ADMIN DASHBOARD ---
  if (view === 'admin_dashboard') {
    return (
      <AdminLayout currentView={adminView} onChangeView={setAdminView} onLogout={handleLogout} t={t}>
        {adminView === 'admin_home' && <AdminDashboard items={menuItems} categories={categories} t={t} />}

        {adminView === 'admin_upload' && (
          <ItemWizard
            categories={categories}
            sections={sections}
            onSave={addItem}
            onAddCategory={(cat) => menuService.addCategory(cat)}
            onCancel={() => setAdminView('admin_home')}
            t={t}
          />
        )}

        {adminView === 'admin_items' && (
          <ItemsList
            items={menuItems}
            categories={categories}
            onUpdate={updateItem}
            onDelete={deleteItem}
            t={t}
          />
        )}

        {adminView === 'admin_sections' && (
          <AdminSections
            t={t}
            sections={sections}
            onAdd={(s) => menuService.addSection(s)}
            onUpdate={(id, s) => menuService.updateSection(id, s)}
            onDelete={(id) => menuService.deleteSection(id)}
            onSelect={(id) => {
              setAdminSelectedSectionId(id);
              setAdminView('admin_categories');
            }}
          />
        )}

        {adminView === 'admin_categories' && (
          <CategoryManager
            t={t}
            categories={adminSelectedSectionId ? categories.filter(c => c.sectionId === adminSelectedSectionId) : categories}
            sections={sections}
            items={menuItems}
            onUpdate={(id, p) => menuService.updateCategory(id, p)}
            onAdd={(c) => menuService.addCategory(c)}
            onDelete={(id) => menuService.deleteCategory(id)}
            onBack={adminSelectedSectionId ? () => { setAdminSelectedSectionId(null); setAdminView('admin_sections'); } : undefined}
            onManageItems={(catId) => {
              setAdminSelectedCategoryId(catId);
              setAdminView('admin_items_by_category');
            }}
          />
        )}

        {adminView === 'admin_items_by_category' && (
          <ItemsList
            items={menuItems}
            categories={categories}
            categoryId={adminSelectedCategoryId}
            onUpdate={updateItem}
            onDelete={deleteItem}
            onAdd={addItem}
            onBack={() => { setAdminSelectedCategoryId(null); setAdminView('admin_categories'); }}
            t={t}
          />
        )}

        {adminView === 'admin_settings' && (
          <SettingsManager
            settings={appSettings}
            onUpdate={(l: string, p: any) => setAppSettings(prev => ({ ...prev, [l]: { ...(prev[l] || {}), ...p } }))}
            t={t}
            items={menuItems}
            categories={categories}
            sections={sections}

            profiles={profiles}
            roles={roles}
          />
        )}

        {adminView === 'admin_media' && (
          <MediaLibrary className="h-full" />
        )}

        {adminView === 'admin_orders' && (
          <AdminOrders menuItems={menuItems} />
        )}

        {adminView === 'admin_profiles' && (
          <ProfileManager
            profiles={profiles}
            onAdd={(p) => menuService.addProfile(p)}
            onUpdate={(id, p) => menuService.updateProfile(id, p)}
            onDelete={(id) => menuService.deleteProfile(id)}
            t={t}
            isTeamSectionVisible={appSettings.showTeamSection !== false}
            onToggleTeamSection={(val) => setAppSettings(prev => ({ ...prev, showTeamSection: val }))}
            roles={roles}
            onAddRole={handleAddRole}
            onUpdateRole={handleUpdateRole}
            onMoveRole={handleMoveRole}
            onDeleteRole={handleDeleteRole}
          />
        )}
      </AdminLayout>
    );
  }

  // --- RENDER: ADMIN LOGIN ---
  if (view === 'admin_login') {
    return (
      <div className="min-h-screen bg-[#fdfaf7] flex flex-col items-center justify-center p-6 text-center" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="w-32 h-32 bg-[#2c2416] rounded-full p-6 border-2 border-[#b8956a] mb-8 shadow-2xl flex items-center justify-center">
          <span className="text-[#b8956a] font-black text-4xl">M</span>
        </div>
        <h2 className="text-3xl font-black text-[#231f20] mb-8">{t.adminLogin}</h2>
        <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-gray-50 flex flex-col gap-6 w-full max-w-md">
          <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdminLogin()} className="w-full bg-gray-50 p-5 rounded-2xl text-center font-bold text-xl outline-none focus:ring-2 ring-[#c68a53]/20" />
          <button onClick={handleAdminLogin} className="w-full bg-[#2c2416] text-[#b8956a] py-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-transform">{t.loginButton}</button>
        </div>
        <button onClick={() => setView('home')} className="mt-8 text-gray-400 font-bold hover:text-[#c68a53]">{t.backToHome}</button>
      </div>
    );
  }

  // --- RENDER: CUSTOMER APP ---
  return (
    <div className={`min-h-screen flex flex-col w-full md:max-w-[580px] lg:max-w-[680px] mx-auto bg-[#faf8f5] shadow-[0_0_28px_-8px_rgba(0,0,0,0.08)] md:my-5 md:rounded-[16px] overflow-hidden relative ${isRtl ? 'rtl text-right' : 'ltr text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <SEO
        title={view.startsWith('admin') ? 'Admin Panel' : (selectedProfile ? `${selectedProfile.name} | Team` : (currentCategory ? `${(currentCategory.translations[lang] as any)?.name || currentCategory.translations[lang]} | Menu` : 'Menu'))}
        description={t.slogan || "Best Keto Restaurant in Erbil"}
      />
      {pendingOutbox > 0 && (
        <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-300 p-3 rounded-lg shadow-md z-50 flex items-center gap-3">
          <div className="text-sm text-yellow-800 font-bold">Pending syncs: {pendingOutbox}</div>
          <button onClick={manualSync} className="px-3 py-1 bg-white border rounded-md text-sm">Sync now</button>
        </div>
      )}
      {isOffline && (
        <div className="bg-orange-600 text-white text-[10px] font-bold py-1.5 px-4 text-center sticky top-0 z-[100] flex items-center justify-center gap-2">
          <WifiOff size={12} /> {t.offline}
        </div>
      )}

      {/* HEADER */}
      <Header
        view={view}
        onBack={() => {
          if (view === 'cart') {
            setView(selectedCategoryId ? 'items' : 'home');
          } else {
            setSelectedCategoryId(null);
            setView('home');
          }
        }}
        logoPath={logoPath}
        restaurantName={t.restaurantName}
        address={t.address}
        phone={t.phone}
        sections={displaySections}
        activeSectionId={activeSectionId}
        onSectionChange={(id) => { setActiveSectionId(id); setView('home'); setSelectedCategoryId(null); }}
        lang={lang}
        setLang={setLang}
        t={t}
        cartCount={cart.reduce((acc, c) => acc + c.quantity, 0)}
        onOpenCart={() => setView('cart')}
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 px-4 sm:px-6 md:px-12 pb-40 md:pb-56 pt-6 view-transition">
        {view === 'home' && (
          <>
            <div className="relative mb-6">
              <input type="text" placeholder={t.search} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white rounded-[22px] px-7 py-5 outline-none text-base font-bold border border-gray-100 focus:border-[#c68a53]/30 transition-all shadow-xl shadow-gray-200/50" />
              <Search className="absolute end-6 top-1/2 -translate-y-1/2 text-[#c68a53]" size={20} />
            </div>

            {appSettings.showTeamSection !== false && (
              <button
                onClick={() => setView('profiles')}
                className="w-full mb-8 bg-[#231f20] text-[#c68a53] py-4 rounded-[22px] font-black text-lg shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
              >
                <User size={24} />
                <span>{t.restaurantName} {t.team}</span>
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCategories.map(category => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onClick={() => { setSelectedCategoryId(category.id); setView('items'); }}
                  lang={lang}
                  t={t}
                  itemCount={menuItems.filter(i => i.categoryId === category.id).length}
                />
              ))}
            </div>
          </>
        )}

        {view === 'profiles' && (
          <div className="flex flex-col gap-8 animate-in slide-in-from-right duration-500">
            <h2 className="text-3xl font-black text-[#231f20] flex items-center gap-3 mb-2">
              <span className="w-2.5 h-10 bg-[#c68a53] rounded-full"></span>
              {t.restaurantName} {t.team}
            </h2>
            <p className="text-gray-500 text-sm">{t.teamIntro}</p>

            {(roles.length > 0 ? roles : ['staff']).map(roleItem => {
              const roleId = typeof roleItem === 'string' ? roleItem : roleItem.id;
              // Prefer role translations for current language, fallback to name or translation keys
              const displayLabel = typeof roleItem === 'string'
                ? ((t as any)[`role_${roleId}`] || roleId)
                : (roleItem.translations?.[lang] || roleItem.name);

              // Logic: show profiles for this role.
              const groupProfiles = profiles.filter(p => p.isActive && (p.role === roleId || (!p.role && roleId === 'staff')));

              if (groupProfiles.length === 0) return null;

              return (
                <div key={roleId} className="flex flex-col gap-4">
                  <h3 className="text-xl font-black text-[#c68a53] uppercase tracking-wider border-b border-gray-100 pb-2">
                    {displayLabel}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {groupProfiles.map(profile => (
                      <div
                        key={profile.id}
                        onClick={() => { setSelectedProfile(profile); setView('profile_details'); }}
                        className="bg-white p-6 rounded-[30px] shadow-xl flex flex-col items-center gap-4 cursor-pointer hover:scale-105 transition-transform border border-gray-50"
                      >
                        <div className="w-24 h-24 rounded-full border-4 border-[#c68a53]/20 overflow-hidden shadow-lg">
                          {profile.image ? <img src={profile.image} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300"><User size={32} /></div>}
                        </div>
                        <div className="text-center">
                          <h3 className="font-black text-[#231f20] text-lg leading-tight">
                            {profile.translations?.[lang]?.name || profile.name}
                          </h3>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === 'profile_details' && selectedProfile && (
          <div className="flex flex-col gap-6 animate-in zoom-in-95 duration-300">
            <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden relative">
              <div className="h-32 bg-[#231f20] relative">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#c68a53] to-transparent"></div>
              </div>
              <div className="px-8 pb-8 flex flex-col items-center -mt-10 relative z-10">
                <div className="w-32 h-32 rounded-full border-[6px] border-white shadow-2xl overflow-hidden bg-gray-100 mb-4">
                  {selectedProfile.image ? <img src={selectedProfile.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={40} /></div>}
                </div>

                <h2 className="text-3xl font-black text-[#231f20] text-center mb-1">
                  {selectedProfile.translations?.[lang]?.name || selectedProfile.name}
                </h2>
                <p className="text-[#c68a53] font-bold text-sm uppercase tracking-widest mb-6 border-b border-gray-100 pb-4 w-full text-center">
                  {(() => {
                    const r = roles.find(r => r.id === selectedProfile.role);
                    return r?.translations?.[lang] || (t as any)[`role_${selectedProfile.role}`] || r?.name || 'Team Member';
                  })()}
                </p>

                {(selectedProfile.translations?.[lang]?.description || selectedProfile.description) && (
                  <div className="w-full bg-gray-50/80 p-6 rounded-[22px] border border-gray-100 mb-6 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#c68a53]"></div>
                    <p className="text-[#231f20] font-medium leading-loose text-base md:text-lg text-justify whitespace-pre-wrap relative z-10">
                      {selectedProfile.translations?.[lang]?.description || selectedProfile.description}
                    </p>
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#c68a53]/5 rounded-full blur-2xl group-hover:bg-[#c68a53]/10 transition-colors"></div>
                  </div>
                )}

                <div className="w-full space-y-4">
                  {selectedProfile.phone && (
                    <a href={`tel:${selectedProfile.phone}`} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-[#c68a53] hover:text-white transition-colors group">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#231f20] shadow-sm group-hover:text-[#c68a53]">
                        <Phone size={20} />
                      </div>
                      <span className="font-bold text-lg">{selectedProfile.phone}</span>
                    </a>
                  )}
                  {selectedProfile.email && (
                    <a href={`mailto:${selectedProfile.email}`} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-[#c68a53] hover:text-white transition-colors group">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#231f20] shadow-sm group-hover:text-[#c68a53]">
                        <Mail size={20} />
                      </div>
                      <span className="font-bold text-lg truncate">{selectedProfile.email}</span>
                    </a>
                  )}

                  <div className="grid grid-cols-4 gap-3 pt-4">
                    {selectedProfile.socials.facebook && (
                      <a href={selectedProfile.socials.facebook} target="_blank" rel="noreferrer noopener" className="aspect-square bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors text-2xl">
                        <Facebook />
                      </a>
                    )}
                    {selectedProfile.socials.instagram && (
                      <a href={selectedProfile.socials.instagram} target="_blank" rel="noreferrer noopener" className="aspect-square bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors text-2xl">
                        <Instagram />
                      </a>
                    )}
                    {selectedProfile.socials.whatsapp && (
                      <a href={selectedProfile.socials.whatsapp} target="_blank" rel="noreferrer noopener" className="aspect-square bg-green-50 text-green-600 rounded-2xl flex items-center justify-center hover:bg-green-600 hover:text-white transition-colors text-2xl">
                        <MessageCircle />
                      </a>
                    )}
                    {selectedProfile.socials.tiktok && (
                      <a href={selectedProfile.socials.tiktok} target="_blank" rel="noreferrer noopener" className="aspect-square bg-gray-100 text-black rounded-2xl flex items-center justify-center hover:bg-black hover:text-white transition-colors text-2xl">
                        <Video />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'items' && (
          <div className="flex flex-col gap-8 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-[#231f20] uppercase flex items-center gap-4">
                <span className="w-2.5 h-10 bg-[#c68a53] rounded-full"></span>
                {currentCategory?.translations[lang]}
              </h2>
              <div className="flex items-center gap-1 bg-[#76a35a]/10 px-4 py-1.5 rounded-full">
                <Leaf size={14} className="text-[#76a35a]" />
                <span className="text-[10px] font-black text-[#76a35a] uppercase">{t.premiumKeto}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredItems.map(item => {
                const qty = cart.find(c => c.id === item.id)?.quantity || 0;
                return (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    lang={lang}
                    cartQuantity={qty}
                    onAdd={() => addToCart(item.id)}
                    onRemove={() => removeFromCart(item.id)}
                    t={t}
                  />
                );
              })}
            </div>
          </div>
        )}

        {view === 'cart' && (
          <div className="flex flex-col gap-6 pt-2 animate-fade-up">
            <h2 className="text-3xl font-heading font-black text-primary border-b border-gray-100 pb-4 flex items-center gap-3">
              <ShoppingBag className="text-accent" size={28} /> {t.myOrder}
            </h2>

            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 animate-float">
                  <ShoppingBag size={40} strokeWidth={1.5} />
                </div>
                <p className="font-heading font-bold text-lg text-text-muted">{t.emptyBasket}</p>
                <button onClick={() => { setView('home'); setSelectedCategoryId(null); }} className="mt-8 btn-primary shadow-lg hover:shadow-xl active:scale-95 transform transition-all">
                  {t.backToHome}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="bg-white rounded-[24px] shadow-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                  {cart.map(cartItem => {
                    const item = menuItems.find(i => i.id === cartItem.id);
                    if (!item) return null;
                    return (
                      <div key={item.id} className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-gray-50 shrink-0">
                            <img src={item.image || logoPath} className="w-full h-full object-cover" loading="lazy" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-heading font-bold text-primary text-base leading-tight">
                              {item.emoji} {item.translations[lang].name}
                            </span>
                            <span className="text-accent font-bold text-sm mt-0.5">
                              {(item.price * cartItem.quantity).toLocaleString()} <span className="text-[10px]">IQD</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1 shadow-inner">
                          <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-50 active:scale-90 transition-all">
                            <Minus size={16} />
                          </button>
                          <span className="font-bold text-base w-6 text-center text-primary">{cartItem.quantity}</span>
                          <button onClick={() => addToCart(item.id)} className="w-8 h-8 flex items-center justify-center bg-primary text-accent rounded-lg shadow-lg hover:bg-primary-light active:scale-90 transition-all">
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-6 bg-primary text-white rounded-[24px] shadow-2xl flex flex-col gap-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                  <div className="flex justify-between items-center relative z-10">
                    <span className="text-gray-400 font-medium">{t.totalPriceLabel}</span>
                    <span className="font-heading font-black text-2xl tracking-tight">
                      {(cart.reduce((acc, curr) => acc + (menuItems.find(i => i.id === curr.id)?.price || 0) * curr.quantity, 0)).toLocaleString()} <span className="text-accent text-sm">IQD</span>
                    </span>
                  </div>
                  <button onClick={() => placeOrder()} className="w-full py-4 bg-accent text-primary font-black rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all text-lg flex items-center justify-center gap-2">
                    {(t as any).orderNow || 'Place Order'} ✨
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER FLOATING DOCK */}
      {view !== 'cart' && cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[500px] px-4 z-50 animate-fade-up">
          <button
            onClick={() => setView('cart')}
            className="w-full bg-primary/95 backdrop-blur-md text-white py-4 rounded-[24px] shadow-2xl font-bold text-lg flex items-center justify-between px-6 border border-white/10 active:scale-95 transition-all group hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent text-primary flex items-center justify-center font-black text-sm shadow-md group-hover:scale-110 transition-transform">
                {cart.reduce((a, c) => a + c.quantity, 0)}
              </div>
              <span>{t.showOrder}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-500 font-light">|</span>
              <span className="text-accent font-heading font-black tracking-tight">
                {(cart.reduce((acc, curr) => acc + (menuItems.find(i => i.id === curr.id)?.price || 0) * curr.quantity, 0)).toLocaleString()} <span className="text-xs">IQD</span>
              </span>
            </div>
          </button>
        </div>
      )}


      {/* BRANDING FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 z-[60]">
        {/* Recovery status banner */}
        {recoveryState.status !== 'idle' && (
          <div className="fixed top-6 end-6 z-[110]">
            <div className={`px-4 py-2 rounded-lg shadow-lg ${recoveryState.status === 'trying' ? 'bg-yellow-100 text-yellow-900' : recoveryState.status === 'success' ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>
              {recoveryState.status === 'trying' && `Trying to recover (${recoveryState.attempts}/3)...`}
              {recoveryState.status === 'success' && 'Recovered — UI refreshed'}
              {recoveryState.status === 'failed' && 'Recovery failed — reloading...'}
            </div>
          </div>
        )}

        {/* Offline Indicator */}
        {isOffline && (
          <div className="fixed bottom-24 right-4 z-[100] animate-in slide-in-from-bottom duration-500">
            <div className="bg-black/80 backdrop-blur-md text-[#c68a53] px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-3 border border-[#c68a53]/30">
              <WifiOff size={18} className="animate-pulse" />
              <span className="font-bold text-xs uppercase tracking-widest">Offline Mode</span>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-[560px] w-full px-3 sm:px-4 pt-3 pb-2 bg-[#231f20] shadow-[0_-14px_38px_rgba(0,0,0,0.45)] flex items-center justify-center gap-2 rounded-t-[30px] border-t border-[#c68a53]/20">
          <span className="font-bold text-sm sm:text-base md:text-base text-center text-white/90 max-w-[240px] sm:max-w-[320px] md:max-w-[420px]">{t.slogan}</span>
          <div className="relative group perspective">
            <img src={logoPath} alt={t.logoAlt} className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-2 border-[#c68a53] group-hover:scale-[2.5] group-hover:-translate-y-3 transition-all duration-500 ease-out origin-bottom shadow-sm z-50 bg-[#231f20] object-cover" />
          </div>
        </div>
      </div>

      {/* ITEM PREVIEW MODAL */}
      {
        previewItem && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setPreviewItem(null)}>
            <div className="bg-white rounded-[35px] w-full max-w-sm overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setPreviewItem(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md hover:bg-black/70 transition-colors"
              >
                x
              </button>

              <div className="w-full h-80 relative">
                <img src={previewItem.image || logoPath} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <h3 className="text-2xl font-black mb-1">{previewItem.emoji} {previewItem.translations[lang]?.name}</h3>
                  <span className="text-[#c68a53] font-black text-lg bg-black/40 px-3 py-1 rounded-lg backdrop-blur-md">
                    {previewItem.price.toLocaleString()} {t.currency}
                  </span>
                </div>
              </div>

              <div className="p-6 pt-4">
                <h4 className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-3">پێکهاتەکان</h4>
                <p className="text-[#231f20] font-medium leading-relaxed text-sm">
                  {previewItem.translations[lang]?.ingredients || "No ingredients listed."}
                </p>

                <button
                  onClick={() => { addToCart(previewItem.id); setPreviewItem(null); }}
                  className="w-full mt-6 bg-[#231f20] text-[#c68a53] py-4 rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Plus size={20} /> {t.addToCart || "Add to Cart"}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default App;
