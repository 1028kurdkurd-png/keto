import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    writeBatch,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase';
import { getIdTokenResult } from 'firebase/auth';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { MenuItem, Category, Section, Profile, Role } from '../types';
import { INITIAL_MENU_ITEMS, CATEGORIES, INITIAL_SECTIONS, INITIAL_ROLES } from '../constants';

const ITEMS_COL = 'menuItems';
const CATS_COL = 'categories';
const SECTS_COL = 'sections';
const ORDERS_COL = 'orders';

export const menuService = {
    // --- AUTH HELPERS ---
    ensureAdmin: async () => {
        const user = auth.currentUser;
        if (!user) throw new Error('Not signed in');
        const token = await getIdTokenResult(user, true);
        const claims: any = token.claims || {};
        if (claims.admin !== true) throw new Error('Insufficient permissions: admin claim required');
        return true;
    },

    // --- SUBSCRIPTIONS (Real-time) ---
    subscribeToItems: (callback: (_items: MenuItem[]) => void) => {
        return onSnapshot(collection(db, ITEMS_COL), (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as MenuItem));
            // Sort by order ascending, then by id if order is missing
            items.sort((a, b) => (a.order || 0) - (b.order || 0));
            callback(items);
        });
    },

    subscribeToCategories: (callback: (_cats: Category[]) => void) => {
        return onSnapshot(collection(db, CATS_COL), (snapshot) => {
            const cats = snapshot.docs.map(doc => ({ ...doc.data() } as Category));
            // Sort by order
            cats.sort((a, b) => (a.order || 0) - (b.order || 0));
            callback(cats);
        });
    },

    subscribeToSections: (callback: (_secs: Section[]) => void) => {
        return onSnapshot(collection(db, SECTS_COL), (snapshot) => {
            const secs = snapshot.docs.map(doc => ({ ...doc.data() } as Section));
            // Sort by 'order' property ascending
            secs.sort((a, b) => (a.order || 0) - (b.order || 0));
            callback(secs);
        });
    },

    subscribeToProfiles: (callback: (_profiles: Profile[]) => void) => {
        return onSnapshot(collection(db, 'profiles'), (snapshot) => {
            const profiles = snapshot.docs.map(doc => ({ ...doc.data() } as Profile));
            profiles.sort((a, b) => (a.order || 0) - (b.order || 0));
            callback(profiles);
        });
    },

    subscribeToRoles: (callback: (_roles: Role[]) => void) => {
        return onSnapshot(collection(db, 'roles'), (snapshot) => {
            const roles = snapshot.docs.map(doc => ({ ...doc.data() } as Role));
            roles.sort((a, b) => (a.order || 0) - (b.order || 0));
            callback(roles);
        });
    },

    // --- ON-DEMAND FETCH HELPERS ---
    fetchItems: async (): Promise<MenuItem[]> => {
        const snapshot = await getDocs(collection(db, ITEMS_COL));
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as MenuItem));
        items.sort((a, b) => (a.order || 0) - (b.order || 0));
        return items;
    },

    fetchCategories: async (): Promise<Category[]> => {
        const snapshot = await getDocs(collection(db, CATS_COL));
        const cats = snapshot.docs.map(doc => ({ ...doc.data() } as Category));
        cats.sort((a, b) => (a.order || 0) - (b.order || 0));
        return cats;
    },

    fetchSections: async (): Promise<Section[]> => {
        const snapshot = await getDocs(collection(db, SECTS_COL));
        const secs = snapshot.docs.map(doc => ({ ...doc.data() } as Section));
        secs.sort((a, b) => (a.order || 0) - (b.order || 0));
        return secs;
    },

    fetchProfiles: async (): Promise<Profile[]> => {
        const snapshot = await getDocs(collection(db, 'profiles'));
        const profiles = snapshot.docs.map(doc => ({ ...doc.data() } as Profile));
        profiles.sort((a, b) => (a.order || 0) - (b.order || 0));
        return profiles;
    },

    fetchRoles: async (): Promise<Role[]> => {
        const snapshot = await getDocs(collection(db, 'roles'));
        const roles = snapshot.docs.map(doc => ({ ...doc.data() } as Role));
        roles.sort((a, b) => (a.order || 0) - (b.order || 0));
        return roles;
    },

    // --- ORDERS QUERY ---
    fetchOrdersByDevice: async (deviceId: string) => {
        const q = query(collection(db, ORDERS_COL), where('deviceId', '==', deviceId), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    // --- EXPORT ---
    exportData: async (): Promise<import('../types').ExportPackage> => {
        const [items, categories, sections, profiles, roles] = await Promise.all([
            menuService.fetchItems(),
            menuService.fetchCategories(),
            menuService.fetchSections(),
            menuService.fetchProfiles(),
            menuService.fetchRoles()
        ]);

        const meta = {
            version: '1.0.0',
            createdAt: Date.now(),
        };

        // Compute a lightweight checksum using djb2
        const payload = { meta: { ...meta }, items, categories, sections, profiles, roles };
        try {
            const text = JSON.stringify(payload);
            let hash = 5381;
            for (let i = 0; i < text.length; i++) { hash = ((hash << 5) + hash) + text.charCodeAt(i); }
            (payload.meta as any).checksum = (hash >>> 0).toString(16);
        } catch (e) {
            console.warn('Failed to compute checksum', e);
        }

        return payload as import('../types').ExportPackage;
    },

    // Save a backup record (metadata) to Firestore
    saveBackupRecord: async (record: Partial<import('../types').BackupRecord>) => {
        try {
            await menuService.ensureAdmin();
            const docRef = await addDoc(collection(db, 'backups'), { ...record, createdAt: Date.now() });
            return docRef.id;
        } catch (e) {
            console.warn('saveBackupRecord: falling back to local storage because:', e);
            try {
                const existing = JSON.parse(localStorage.getItem('local_backups') || '[]');
                const id = 'local_' + Date.now();
                const rec = { id, createdAt: Date.now(), ...record };
                existing.push(rec);
                localStorage.setItem('local_backups', JSON.stringify(existing));
                return id;
            } catch (le) {
                console.warn('Local backup save failed', le);
                throw e;
            }
        }
    },

    // Upload full payload JSON to Firebase Storage and return url/path. Accepts optional progress callback.
    saveBackupFile: async (payload: import('../types').ExportPackage, onProgress?: (_percent: number) => void) => {
        try {
            await menuService.ensureAdmin();
            const storage = getStorage();
            const fileName = `backups/backup_${payload.meta.createdAt}_${payload.meta.checksum || Math.random().toString(36).slice(2, 8)}.json`;
            const text = JSON.stringify(payload);
            const blob = new Blob([text], { type: 'application/json' });
            const ref = storageRef(storage, fileName);
            const uploadTask = uploadBytesResumable(ref, blob as any);

            return await new Promise((resolve, reject) => {
                uploadTask.on('state_changed', (snapshot) => {
                    const pct = snapshot.totalBytes ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) : 0;
                    if (onProgress) onProgress(pct);
                }, (err) => {
                    console.warn('Failed to upload backup file', err);
                    reject(err);
                }, async () => {
                    try {
                        const url = await getDownloadURL(ref);
                        const sizeBytes = blob.size;
                        resolve({ url, path: fileName, sizeBytes });
                    } catch (e) { reject(e); }
                });
            });
        } catch (e) {
            console.warn('Failed to upload backup file', e);
            // Attempt to POST to local sync endpoint so the service worker (BackgroundSync) can pick it up
            try {
                await fetch('/sync/backup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Mazin-Background': '1' },
                    body: JSON.stringify({ payload, meta: payload.meta })
                });
                // If fetch didn't throw, assume SW queued or endpoint accepted it
                return { queuedBySW: true } as any;
            } catch (fe) {
                console.warn('Local sync endpoint not available, falling back to outbox', fe);
                // Fallback: queue into IndexedDB outbox for app-level retry
                try {
                    const { addOutboxItem } = await import('../src/utils/offlineOutbox' as any);
                    await addOutboxItem('backupFile', { payload, meta: payload.meta });
                    return { queued: true } as any;
                } catch (oe) {
                    console.warn('Failed to queue backup file offline', oe);
                }
            }
            throw e;
        }
    },

    // Restore from exported payload (supports merge/replace and conflict strategies)
    restoreFromExport: async (
        payload: import('../types').ExportPackage,
        options: { mode?: 'merge' | 'replace', conflictStrategy?: 'merge' | 'overwrite' | 'skip', idHandling?: 'preserve' | 'generate' } = { mode: 'merge', conflictStrategy: 'merge', idHandling: 'preserve' }
    ) => {
        const report: any = {
            added: { items: 0, categories: 0, sections: 0, profiles: 0, roles: 0 },
            updated: { items: 0, categories: 0, sections: 0, profiles: 0, roles: 0 },
            skipped: { items: 0, categories: 0, sections: 0, profiles: 0, roles: 0 },
            noChange: { items: 0, categories: 0, sections: 0, profiles: 0, roles: 0 },
            failed: []
        };
        const mode = options.mode || 'merge';
        const conflictStrategy = options.conflictStrategy || 'merge';
        const idHandling = options.idHandling || 'preserve';

        if (mode === 'replace') {
            // Replace mode should be handled by replaceFromExport which creates pre-snapshot and does deletes.
            throw new Error('Replace mode is not handled by restoreFromExport; use replaceFromExport for destructive replace');
        }

        const docEqual = (a: any, b: any) => {
            try { return JSON.stringify(a) === JSON.stringify(b); } catch (e) { return false; }
        };

        // Helper to process a collection with snapshots loaded once
        const processCollection = async (colName: string, payloadDocs: any[], reportKeyAdd: string, reportKeyUpdate: string, reportKeySkip: string, reportKeyNoChange: string) => {
            try {
                const snapshot = await getDocs(collection(db, colName));
                for (const docPayload of payloadDocs || []) {
                    try {
                        const existingDoc = snapshot.docs.find(d => d.data().id === docPayload.id);
                        if (existingDoc) {
                            const existingData = existingDoc.data();
                            if (docEqual(existingData, docPayload)) {
                                report.noChange[reportKeyNoChange]++;
                                continue;
                            }
                            if (conflictStrategy === 'skip') {
                                report.skipped[reportKeySkip]++;
                                continue;
                            }
                            if (conflictStrategy === 'overwrite') {
                                await updateDoc(doc(db, colName, existingDoc.id), docPayload as any);
                                report.updated[reportKeyUpdate]++;
                                continue;
                            }
                            // merge
                            const merged = { ...existingData, ...docPayload };
                            await updateDoc(doc(db, colName, existingDoc.id), merged as any);
                            report.updated[reportKeyUpdate]++;
                        } else {
                            // New document
                            const toWrite = { ...docPayload };
                            if (idHandling === 'generate') {
                                toWrite.id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                            }
                            await addDoc(collection(db, colName), toWrite as any);
                            report.added[reportKeyAdd]++;
                        }
                    } catch (e) {
                        report.failed.push({ collection: colName, id: docPayload.id, error: String(e) });
                    }
                }
            } catch (e) {
                report.failed.push({ collection: colName, error: String(e) });
            }
        };

        // Process collections
        await processCollection('menuItems', payload.items || [], 'items', 'items', 'items', 'items');
        await processCollection(CATS_COL, payload.categories || [], 'categories', 'categories', 'categories', 'categories');
        await processCollection(SECTS_COL, payload.sections || [], 'sections', 'sections', 'sections', 'sections');
        await processCollection('profiles', payload.profiles || [], 'profiles', 'profiles', 'profiles', 'profiles');
        await processCollection('roles', payload.roles || [], 'roles', 'roles', 'roles', 'roles');

        return report;
    },

    // Take a pre-restore snapshot and save it as a full backup document
    preRestoreBackup: async () => {
        try {
            await menuService.ensureAdmin();
            const payload = await menuService.exportData();
            const meta = { version: payload.meta.version, createdAt: Date.now(), note: 'pre-restore-snapshot' };
            const docRef = await addDoc(collection(db, 'backups'), { meta, payload });
            return { id: docRef.id, payload };
        } catch (e) {
            console.warn('Failed to create pre-restore backup', e);
            throw e;
        }
    },

    // Replace entire collections with payload (destructive). Creates pre-restore snapshot, performs deletes then writes new data in batches.
    replaceFromExport: async (payload: import('../types').ExportPackage) => {
        const report: any = { deleted: { items: 0, categories: 0, sections: 0, profiles: 0, roles: 0 }, added: { items: 0, categories: 0, sections: 0, profiles: 0, roles: 0 }, failed: [] };
        // 1. Pre-restore snapshot
        const snapshot = await menuService.preRestoreBackup();

        try {
            // 2. Delete all docs in each collection
            const deleteCollections = async (colName: string, counterKey: string) => {
                const snapshot = await getDocs(collection(db, colName));
                if (snapshot.empty) return;
                const batch = writeBatch(db);
                let i = 0;
                snapshot.docs.forEach(docSnap => {
                    batch.delete(doc(db, colName, docSnap.id));
                    i++;
                });
                await batch.commit();
                report.deleted[counterKey] = i;
            };

            await deleteCollections(ITEMS_COL, 'items');
            await deleteCollections(CATS_COL, 'categories');
            await deleteCollections(SECTS_COL, 'sections');
            await deleteCollections('profiles', 'profiles');
            await deleteCollections('roles', 'roles');

            // 3. Write new payload in batches (respect Firestore limits)
            const writeInBatches = async (colName: string, docsArray: any[], key: string) => {
                const chunkSize = 300; // conservative
                for (let i = 0; i < docsArray.length; i += chunkSize) {
                    const chunk = docsArray.slice(i, i + chunkSize);
                    const batch = writeBatch(db);
                    chunk.forEach(d => {
                        const ref = doc(collection(db, colName));
                        batch.set(ref, d as any);
                    });
                    await batch.commit();
                    report.added[key] += chunk.length;
                }
            };

            await writeInBatches('menuItems', payload.items || [], 'items');
            await writeInBatches(CATS_COL, payload.categories || [], 'categories');
            await writeInBatches(SECTS_COL, payload.sections || [], 'sections');
            await writeInBatches('profiles', payload.profiles || [], 'profiles');
            await writeInBatches('roles', payload.roles || [], 'roles');

            return { success: true, report };
        } catch (e) {
            console.error('Replace failed, attempting rollback to pre-restore snapshot', e);
            // Attempt to roll back by merging snapshot payload back
            try {
                await menuService.restoreFromExport(snapshot.payload, { mode: 'merge' });
                return { success: false, rolledBack: true, error: String(e) };
            } catch (rerr) {
                console.error('Rollback failed', rerr);
                return { success: false, rolledBack: false, error: String(e) };
            }
        }
    },

    // List available backup records
    listBackups: async () => {
        try {
            await menuService.ensureAdmin();
            const snapshot = await getDocs(collection(db, 'backups'));
            return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        } catch (e) {
            console.warn('listBackups: falling back to local storage', e);
            try { return JSON.parse(localStorage.getItem('local_backups') || '[]'); } catch (le) { console.warn('Failed to read local backups', le); return []; }
        }
    },

    // Helper: fetch JSON from a URL and report progress if possible
    fetchJsonWithProgress: async (url: string, onProgress?: (_percent: number) => void) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch file');
        const contentLength = res.headers.get('content-length');
        if (!res.body || !contentLength) {
            const text = await res.text();
            if (onProgress) onProgress(100);
            return JSON.parse(text);
        }

        const total = parseInt(contentLength, 10);
        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;
        // Use an explicit reader loop — disable eslint rule for constant condition here
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
                chunks.push(value);
                received += value.length;
                if (onProgress) onProgress(Math.round((received / total) * 100));
            }
        }
        const blob = new Blob(chunks as BlobPart[]);
        const text = await blob.text();
        if (onProgress) onProgress(100);
        return JSON.parse(text);
    },

    // Fetch the full payload for a specific backup record
    getBackupPayload: async (backupId: string, onProgress?: (_percent: number) => void) => {
        const d = await getDoc(doc(db, 'backups', backupId));
        if (!d.exists()) return null;
        const data = d.data() as any;
        if (data.payload) return data.payload;

        // If there is a public fileUrl, fetch it (with progress)
        if (data.fileUrl) {
            try {
                if (onProgress) return await menuService.fetchJsonWithProgress(data.fileUrl, onProgress);
                const res = await fetch(data.fileUrl);
                if (!res.ok) throw new Error('Failed to fetch backup file');
                const json = await res.json();
                return json;
            } catch (e) {
                console.warn('Failed to fetch backup file', e);
                return null;
            }
        }

        // If there is a storage path, resolve download URL and fetch (with progress)
        if (data.storagePath) {
            try {
                const storage = getStorage();
                const url = await getDownloadURL(storageRef(storage, data.storagePath));
                if (onProgress) return await menuService.fetchJsonWithProgress(url, onProgress);
                const res = await fetch(url);
                if (!res.ok) throw new Error('Failed to fetch storage backup file');
                const json = await res.json();
                return json;
            } catch (e) {
                console.warn('Failed to fetch storage path', e);
                return null;
            }
        }

        return null;
    },

    // --- ORDERS ---
    placeOrder: async (order: any) => {
        const docRef = await addDoc(collection(db, ORDERS_COL), { ...order, createdAt: Date.now() });
        return docRef.id;
    },

    subscribeToOrders: (callback: (_orders: any[]) => void) => {
        return onSnapshot(collection(db, ORDERS_COL), (snapshot) => {
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
            orders.sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0));
            callback(orders);
        });
    },

    updateOrder: async (orderId: string, data: Partial<any>) => {
        await updateDoc(doc(db, ORDERS_COL, orderId), data);
    },

    // --- ACTIONS ---

    // Items
    addItem: async (item: MenuItem) => {
        const snapshot = await getDocs(collection(db, ITEMS_COL));
        const order = snapshot.size; // Append to end
        const docRef = await addDoc(collection(db, ITEMS_COL), { ...item, order });
    },

    updateItem: async (id: number | string, data: Partial<MenuItem>) => {
        // We need to find the doc reference. Since we are using `id` inside the fields, not as the doc key:
        // This is inefficient. Ideally we use the doc ID. 
        // BUT we have numeric IDs currently.
        // Let's do a query to find the doc with this 'id'.
        // NOTE: For better performance, we should migrate to using docID = item.id (if unique).
        const snapshot = await getDocs(collection(db, ITEMS_COL));
        // Better:
        const docToUpdate = snapshot.docs.find(d => d.data().id === id);
        if (docToUpdate) {
            await updateDoc(doc(db, ITEMS_COL, docToUpdate.id), data);
        }
    },

    deleteItem: async (id: number) => {
        const snapshot = await getDocs(collection(db, ITEMS_COL));
        const docToDelete = snapshot.docs.find(d => d.data().id === id);
        if (docToDelete) {
            await deleteDoc(doc(db, ITEMS_COL, docToDelete.id));
        }
    },

    // Categories
    addCategory: async (cat: Category) => {
        const snapshot = await getDocs(collection(db, CATS_COL));
        const order = snapshot.size; // Append to end
        await addDoc(collection(db, CATS_COL), { ...cat, order });
    },
    updateCategory: async (id: string, data: Partial<Category>) => {
        const snapshot = await getDocs(collection(db, CATS_COL));
        const d = snapshot.docs.find(doc => doc.data().id === id);
        if (d) { await updateDoc(doc(db, CATS_COL, d.id), data); }
    },
    deleteCategory: async (id: string) => {
        const snapshot = await getDocs(collection(db, CATS_COL));
        const d = snapshot.docs.find(doc => doc.data().id === id);
        if (d) { await deleteDoc(doc(db, CATS_COL, d.id)); }
    },

    // Sections
    addSection: async (sec: Section) => {
        const snapshot = await getDocs(collection(db, SECTS_COL));
        const order = snapshot.size; // Simple way to append to end
        await addDoc(collection(db, SECTS_COL), { ...sec, order });
    },
    updateSection: async (id: string, data: Partial<Section>) => {
        const snapshot = await getDocs(collection(db, SECTS_COL));
        const d = snapshot.docs.find(doc => doc.data().id === id);
        if (d) { await updateDoc(doc(db, SECTS_COL, d.id), data); }
    },
    deleteSection: async (id: string) => {
        const snapshot = await getDocs(collection(db, SECTS_COL));
        const d = snapshot.docs.find(doc => doc.data().id === id);
        if (d) await deleteDoc(doc(db, SECTS_COL, d.id));
    },

    // --- PROFILES ---
    addProfile: async (profile: Profile) => {
        const snapshot = await getDocs(collection(db, 'profiles'));
        const order = snapshot.size;
        await addDoc(collection(db, 'profiles'), { ...profile, order });
    },
    updateProfile: async (id: string, data: Partial<Profile>) => {
        const snapshot = await getDocs(collection(db, 'profiles'));
        const d = snapshot.docs.find(doc => doc.data().id === id);
        if (d) await updateDoc(doc(db, 'profiles', d.id), data);
    },
    deleteProfile: async (id: string) => {
        const snapshot = await getDocs(collection(db, 'profiles'));
        const d = snapshot.docs.find(doc => doc.data().id === id);
        if (d) await deleteDoc(doc(db, 'profiles', d.id));
    },

    // --- ROLES ---
    addRole: async (role: Role) => {
        const snapshot = await getDocs(collection(db, 'roles'));
        const order = snapshot.size;
        await addDoc(collection(db, 'roles'), { ...role, order });
    },
    updateRole: async (id: string, data: Partial<Role>) => {
        const snapshot = await getDocs(collection(db, 'roles'));
        const d = snapshot.docs.find(doc => doc.data().id === id);
        if (d) await updateDoc(doc(db, 'roles', d.id), data);
    },
    deleteRole: async (id: string) => {
        const snapshot = await getDocs(collection(db, 'roles'));
        const d = snapshot.docs.find(doc => doc.data().id === id);
        if (d) await deleteDoc(doc(db, 'roles', d.id));
    },

    // --- INITIALIZATION ---
    // --- INITIALIZATION & SYNC ---
    initializeData: async () => {
        try {
            // Passive check only.
            // We never auto-seed or auto-delete to protect user data.
            const snapshot = await getDocs(collection(db, ITEMS_COL));
            if (snapshot.empty) {
                console.log("Database appears empty or network is slow.");
            } else {
                console.log("Database initialized and data found.");
            }
        } catch (error) {
            console.error("Error initializing data:", error);
        }
    },

    // --- HELPERS ---
    // [REMOVED] deduplicateData and syncWithConstants were removed to prevent accidental data loss.
    // The strict requirement is that NO data should be deleted automatically.

    // --- RESTORE ---
    // --- RESTORE ---
    restoreData: async (data: { items: MenuItem[], categories: Category[], sections: Section[], profiles: Profile[], roles?: Role[] }) => {
        console.log("restoreData called, delegating to replaceFromExport...");

        // Wrap simple data into ExportPackage format
        const payload: import('../types').ExportPackage = {
            meta: {
                version: '1.0.0',
                createdAt: Date.now(),
                checksum: 'restored-via-admin-ui'
            },
            items: data.items,
            categories: data.categories,
            sections: data.sections,
            profiles: data.profiles,
            roles: data.roles || []
        };

        const result = await menuService.replaceFromExport(payload);
        if (!result.success) {
            throw new Error(result.error || "Restore failed");
        }
    }
};

// Individual exports for test compatibility
export const subscribeToItems = menuService.subscribeToItems;
export const fetchItems = menuService.fetchItems;
