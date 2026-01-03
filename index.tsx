
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

import { performAutoFixIfNeeded } from './src/autoFixBlankPage';
// Run async auto-fix (don't block the main thread). The check also honors ?force_sw_fix=1 or ?auto_fix=1
void performAutoFixIfNeeded(rootElement).then(didFix => {
  if (!didFix && typeof window !== 'undefined') {
    console.info('If the page is blank in your browser, you can force remediation from the console with: __runAutoFix(true) or visit the page with ?force_sw_fix=1');
  }
});

// DEV SAFETY: if a previous auto-fix was recorded but the root is still empty during dev, clear the flag and attempt a forced remediation once.
// This helps when an existing stale SW/IDB/caches state blocks the app during active development only.
if (typeof window !== 'undefined' && !(import.meta as any).env.PROD) {
  setTimeout(() => {
    try {
      const txt = (rootElement && rootElement.textContent) ? rootElement.textContent.trim().length : 0;
      const alreadyFixed = !!localStorage.getItem('sw_auto_fix_done');
      if (txt < 50 && alreadyFixed) {
        console.info('Dev safety auto-fix: clearing auto-fix flag and attempting forced remediation');
        try { localStorage.removeItem('sw_auto_fix_done'); } catch (e) { /* ignore */ }
        void performAutoFixIfNeeded(rootElement, { force: true, logging: true });
      }
    } catch (e) { /* ignore */ }
  }, 1500);
}

// Conditionally register the service worker in production only when Vite env opts in
// Register service worker for offline support (PWA)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // Always attempt to register in production like builds.
  // For dev, it might be skipped by VitePWA unless devOptions are enabled.
  import('./src/registerServiceWorker')
    .then(m => m.registerServiceWorker())
    .catch(e => console.warn('SW registration failed', e));
}

import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from './components/ErrorBoundary';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter basename="/">
          <App />
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>
);


