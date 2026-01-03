/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// self.__WB_MANIFEST will be populated by workbox injectManifest
precacheAndRoute((self as any).__WB_MANIFEST || []);

// Basic lifecycle
self.addEventListener('message', (event: any) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    (self as any).skipWaiting();
  }
});

self.addEventListener('activate', (event: any) => {
  event.waitUntil((async () => {
    // Claim clients immediately so new SW takes control
    (self as any).clients.claim();
  })());
});

// Background sync plugin for backup uploads
const bgSyncPlugin = new BackgroundSyncPlugin('backup-queue', {
  maxRetentionTime: 24 * 60 // Retry for max 24 hours (in minutes)
});

// Intercept POSTs to /sync/backup and use BackgroundSync to retry when offline
registerRoute(
  ({ url, request }) => url.pathname === '/sync/backup' && request.method === 'POST',
  new NetworkFirst({ plugins: [bgSyncPlugin], cacheName: 'backup-sync' }),
  'POST'
);

// Network-first for Firestore endpoints (prefer fresh)
registerRoute(
  ({ url }) => url.origin === 'https://firestore.googleapis.com',
  new NetworkFirst({ cacheName: 'firestore-api', networkTimeoutSeconds: 10 })
);

// Cache images from Unsplash, Firebase storage etc (CacheFirst)
registerRoute(
  ({ url }) => url.origin === 'https://images.unsplash.com' || url.origin === 'https://firebasestorage.googleapis.com',
  new CacheFirst({ cacheName: 'remote-images' })
);

// Navigation fallback: try network first, fallback to precached index
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({ cacheName: 'navigation-fallback' })
);

// Optional: notify clients when background sync completes
self.addEventListener('sync', (event: any) => {
  if (event.tag && event.tag.startsWith('workbox-background-sync')) {
    // Broadcast a simple message so clients can react (e.g., update UI)
    event.waitUntil((async () => {
      const clients = await (self as any).clients.matchAll({ includeUncontrolled: true });
      for (const client of clients) {
        client.postMessage({ type: 'BACKGROUND_SYNC_COMPLETE', tag: event.tag });
      }
    })());
  }
});
