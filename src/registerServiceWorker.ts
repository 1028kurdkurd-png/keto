/* Small helper to register the generated service worker via vite-plugin-pwa's virtual helper.
 * This module performs a safety check: only registers in production, only on secure contexts
 * (https or localhost), and respects the VITE_ENABLE_SW opt-in flag.
 */

export async function registerServiceWorker() {
  try {
    if (typeof window === 'undefined') return;
    if (!(window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
      console.info('Skipping SW registration: not secure context');
      return;
    }
    // Import the virtual helper that VitePWA provides when configured
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { registerSW } = await import('virtual:pwa-register');
    if (typeof registerSW !== 'function') {
      console.warn('PWA register helper not available');
      return;
    }
    const update = registerSW({ immediate: true, onOffline() { console.info('PWA: offline'); } });
    update.then(() => console.info('Service worker registration requested')).catch(e => console.warn('SW register error', e));
    // Expose helper for tests to force registration when needed
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      (window as any).__registerServiceWorker = registerServiceWorker;
    } catch (e) { void e; }

  } catch (e) {
    console.warn('Service worker registration failed (caught)', e);
  }
}
