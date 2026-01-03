type FixOptions = { force?: boolean, logging?: boolean };

function isRootVisible(rootElement: HTMLElement | null) {
  if (!rootElement) return false;
  // If the root has meaningful HTML/text content, treat as visible unless explicitly hidden by CSS
  const htmlLen = rootElement.innerHTML ? rootElement.innerHTML.trim().length : 0;
  const textLen = rootElement.textContent ? rootElement.textContent.trim().length : 0;
  try {
    const cs = window.getComputedStyle(rootElement as Element);
    if (cs && (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0')) return false;
  } catch (e) {
    void e;
  }
  if (htmlLen >= 10 || textLen >= 10) return true;
  // Fallback to bounding box check (may be zero in jsdom)
  const rect = rootElement.getBoundingClientRect ? rootElement.getBoundingClientRect() : { width: 0, height: 0 } as any;
  if (rect.width === 0 && rect.height === 0) return false;
  return true;
}

export async function performAutoFixIfNeeded(rootElement: HTMLElement | null, opts: FixOptions = {}) {
  const { force = false, logging = true } = opts;
  try {
    const urlForce = typeof window !== 'undefined' && window.location && window.location.search && /(?:\?|&)(?:force_sw_fix|auto_fix)=1/.test(window.location.search);
    const alreadyFixed = !!localStorage.getItem('sw_auto_fix_done');
    const visible = isRootVisible(rootElement);

    if (logging) console.info('Auto-fix: check - visible:', visible, 'alreadyFixed:', alreadyFixed, 'force:', force || urlForce);

    if ((force || urlForce) || (!visible && !alreadyFixed)) {
      try {
        localStorage.setItem('sw_auto_fix_done', '1');
      } catch (e) { void e; }

      if (logging) console.warn('Auto-fix: detected problem, attempting remediation (unregister SW, clear caches, delete indexedDB)');

      // Insert a visible banner so users know remediation is in progress
      try {
        showAutoFixBanner();
      } catch (e) { void e; }

      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r: any) => r.unregister().catch(() => void 0)));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if ('indexedDB' in window && 'databases' in indexedDB) {
        const dbs = await (indexedDB as any).databases();
        await Promise.all(dbs.map((d: any) => new Promise(resolve => {
          const req = indexedDB.deleteDatabase(d.name);
          const timer = setTimeout(() => resolve(null), 200);
          req.onsuccess = req.onerror = () => { clearTimeout(timer); resolve(null); };
        })));
      }

      // reload to pick up fresh network
      window.location.reload();
      return true;
    }
  } catch (e) {
    console.warn('Auto-fix: remediation failed', e);
  }

  // Delayed sanity check: if the root appears empty shortly after load, attempt remediation once more.
  try {
    if (typeof window !== 'undefined' && rootElement) {
      setTimeout(async () => {
        try {
          const textLen = (rootElement.textContent || '').trim().length;
          const hasHeader = !!rootElement.querySelector('.poly-bg, h1, [data-app-root]');
          const alreadyFixed = !!localStorage.getItem('sw_auto_fix_done');
          if (!alreadyFixed && (textLen < 20 && !hasHeader)) {
            console.warn('Auto-fix: delayed sanity check triggered remediation (empty root).');
            await performAutoFixIfNeeded(rootElement, { force: true, logging });
          }
        } catch (e) { /* ignore */ }
      }, 800);
    }
  } catch (e) { /* ignore */ }

  return false;
}

export function showAutoFixBanner() {
  try {
    if (document.getElementById('auto-fix-banner')) return document.getElementById('auto-fix-banner')!;
    const banner = document.createElement('div');
    banner.id = 'auto-fix-banner';
    banner.style.position = 'fixed';
    banner.style.left = '0';
    banner.style.right = '0';
    banner.style.top = '0';
    banner.style.padding = '10px';
    banner.style.background = '#fffae6';
    banner.style.color = '#111';
    banner.style.textAlign = 'center';
    banner.style.zIndex = '9999';
    banner.style.fontFamily = 'sans-serif';
    banner.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';

    const msg = document.createElement('span');
    msg.innerText = 'Recovering from a stale cache… clearing data and reloading.';
    banner.appendChild(msg);

    const spacer = document.createElement('span');
    spacer.style.display = 'inline-block';
    spacer.style.width = '12px';
    banner.appendChild(spacer);

    const retry = document.createElement('button');
    retry.id = 'auto-fix-retry';
    retry.innerText = 'Retry';
    retry.style.marginLeft = '8px';
    retry.onclick = function () {
      try {
        const prev = Number(localStorage.getItem('sw_auto_fix_attempts') || '0');
        const next = prev + 1;
        localStorage.setItem('sw_auto_fix_attempts', String(next));
        console.info('Auto-fix telemetry: attempt', next);
        if (typeof (window as any).__runAutoFix === 'function') {
          (window as any).__runAutoFix(true);
        }
      } catch (e) { void e; }
    };
    banner.appendChild(retry);

    const dismiss = document.createElement('button');
    dismiss.id = 'auto-fix-dismiss';
    dismiss.innerText = 'Dismiss';
    dismiss.style.marginLeft = '8px';
    dismiss.onclick = function () {
      try { banner.remove(); } catch (e) { void e; }
    };
    banner.appendChild(dismiss);

    document.body.appendChild(banner);
    return banner;
  } catch (e) {
    return null as any;
  }
}

// Expose a helper the user (or tests) can call from console
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (typeof window !== 'undefined') {
  (window as any).__runAutoFix = async function(force?: boolean) { return performAutoFixIfNeeded(document.getElementById('root'), { force: !!force }); };
  // Expose banner helper for E2E tests to simulate the banner UI
  (window as any).__showAutoFixBanner = showAutoFixBanner;
}
