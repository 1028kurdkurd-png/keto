import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { performAutoFixIfNeeded } from '../../src/autoFixBlankPage';

describe('performAutoFixIfNeeded', () => {
  let origSW: any;
  let origCaches: any;
  let origIDB: any;
  let reloadSpy: any;
  let origLocation: any;

  beforeEach(() => {
    // set up minimal DOM
    document.body.innerHTML = '<div id="root"></div>';

    // stub location.reload (replace window.location temporarily)
    const origLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { ...origLocation, reload: vi.fn() },
      writable: true,
    });
    reloadSpy = (window.location as any).reload;

    // mock serviceWorker
    origSW = (navigator as any).serviceWorker;
    (navigator as any).serviceWorker = {
      getRegistrations: vi.fn().mockResolvedValue([{ unregister: vi.fn().mockResolvedValue(true) }])
    } as any;

    // mock caches
    origCaches = (window as any).caches;
    (window as any).caches = {
      keys: vi.fn().mockResolvedValue(['a']),
      delete: vi.fn().mockResolvedValue(true)
    } as any;

    // mock indexedDB.databases and deleteDatabase (jsdom may not provide indexedDB)
    if (typeof indexedDB !== 'undefined') {
      origIDB = (indexedDB as any).databases;
      (indexedDB as any).databases = vi.fn().mockResolvedValue([{ name: 'db1' }]);
      vi.spyOn(indexedDB, 'deleteDatabase').mockImplementation(() => {
        const evTarget: any = { onsuccess: null, onerror: null };
        setTimeout(() => evTarget.onsuccess && evTarget.onsuccess({}));
        return evTarget as any;
      });
    } else {
      origIDB = undefined;
      (global as any).indexedDB = {
        databases: vi.fn().mockResolvedValue([{ name: 'db1' }]),
        deleteDatabase: vi.fn().mockImplementation(() => ({ onsuccess: null, onerror: null }))
      } as any;
    }

    localStorage.removeItem('sw_auto_fix_done');
  });

  afterEach(() => {
    (navigator as any).serviceWorker = origSW;
    (window as any).caches = origCaches;
    try {
      if (typeof indexedDB !== 'undefined') {
        (indexedDB as any).databases = origIDB;
      } else {
        delete (global as any).indexedDB;
      }
    } catch (e) {
      // ignore
    }
    // restore original location
    Object.defineProperty(window, 'location', { value: origLocation });
    vi.restoreAllMocks();
  });

  it('unregisters service workers, clears caches and deletes indexedDB then reloads when root is empty', async () => {
    const root = document.getElementById('root')!;
    root.innerHTML = '';

    const result = await performAutoFixIfNeeded(root);

    expect(result).toBe(true);
    expect((navigator as any).serviceWorker.getRegistrations).toHaveBeenCalled();
    expect((window as any).caches.keys).toHaveBeenCalled();
    expect(indexedDB.databases).toHaveBeenCalled();
    expect(reloadSpy).toHaveBeenCalled();
  });

  it('shows a visible banner during remediation', async () => {
    const root = document.getElementById('root')!;
    root.innerHTML = '';

    await performAutoFixIfNeeded(root);

    expect(document.getElementById('auto-fix-banner')).not.toBeNull();
  });

  it('shows Retry button and clicking it triggers auto-fix and telemetry', async () => {
    const root = document.getElementById('root')!;
    root.innerHTML = '<p>content</p>';

    // Ensure no auto-run
    localStorage.removeItem('sw_auto_fix_done');
    localStorage.removeItem('sw_auto_fix_attempts');

    // spy on __runAutoFix
    (window as any).__runAutoFix = vi.fn().mockResolvedValue(true);

    // show banner directly
    const { showAutoFixBanner } = await import('../../src/autoFixBlankPage');
    const banner = showAutoFixBanner();

    expect(banner).not.toBeNull();

    const retry = document.getElementById('auto-fix-retry') as HTMLButtonElement;
    expect(retry).not.toBeNull();

    retry.click();

    // click should cause telemetry increment and call __runAutoFix
    expect((window as any).__runAutoFix).toHaveBeenCalledWith(true);
    expect(localStorage.getItem('sw_auto_fix_attempts')).toBe('1');
  });

  it('does nothing when root has content', async () => {
    const root = document.getElementById('root')!;
    root.innerHTML = '<p>Hello</p>';

    const result = await performAutoFixIfNeeded(root);

    expect(result).toBe(false);
    expect((navigator as any).serviceWorker.getRegistrations).not.toHaveBeenCalled();
    expect((window as any).caches.keys).not.toHaveBeenCalled();
    expect(indexedDB.databases).not.toHaveBeenCalled();
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it('runs remediation when root is invisible (display:none)', async () => {
    const root = document.getElementById('root')!;
    root.innerHTML = '<div></div>';

    // mock getComputedStyle to pretend display none
    const origGetComputed = (window as any).getComputedStyle;
    (window as any).getComputedStyle = vi.fn().mockReturnValue({ display: 'none', visibility: 'visible', opacity: '1' });

    const result = await performAutoFixIfNeeded(root);

    expect(result).toBe(true);
    expect((navigator as any).serviceWorker.getRegistrations).toHaveBeenCalled();
    expect((window as any).caches.keys).toHaveBeenCalled();
    expect(indexedDB.databases).toHaveBeenCalled();
    expect(reloadSpy).toHaveBeenCalled();

    // restore
    (window as any).getComputedStyle = origGetComputed;
  });

  it('force option overrides localStorage and runs remediation', async () => {
    const root = document.getElementById('root')!;
    root.innerHTML = '<p>Not empty</p>';

    localStorage.setItem('sw_auto_fix_done', '1');

    const result = await performAutoFixIfNeeded(root, { force: true });

    expect(result).toBe(true);
    expect((navigator as any).serviceWorker.getRegistrations).toHaveBeenCalled();
    expect((window as any).caches.keys).toHaveBeenCalled();
    expect(indexedDB.databases).toHaveBeenCalled();
    expect(reloadSpy).toHaveBeenCalled();
  });
});