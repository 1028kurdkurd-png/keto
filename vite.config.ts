import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/',
    build: {
      minify: 'terser',
      terserOptions: {
        compress: { drop_console: true, drop_debugger: true },
        format: { comments: false }
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-firebase': ['firebase/firestore', 'firebase/app'],
            'vendor-ui': ['lucide-react', 'react-easy-crop'],
            'vendor-react': ['react', 'react-dom', 'react-router-dom']
          }
        }
      },
      cssCodeSplit: true,
      chunkSizeWarningLimit: 600
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        strategies: 'generateSW', // Changed from injectManifest to allow auto-generation
        // srcDir: 'src', // Not needed for generateSW
        // filename: 'sw.js', // Not needed for generateSW unless we want to override output name

        // Register type: use 'prompt' by default to avoid unexpected SW registration in non-prod environments.
        // To enable automatic SW registration in production, set VITE_ENABLE_SW=true in your environment.
        registerType: 'autoUpdate', // Using autoUpdate for "professional" seamless updates
        manifestFilename: 'manifest.json',
        // Disable service worker in dev by default to avoid precache issues; set PWA_DEV=true to enable in dev
        devOptions: { enabled: true }, // Enable in dev for testing
        includeAssets: ['mazinlogo.jpeg', 'assets/*.png', 'assets/*.svg'],
        manifest: {
          name: 'Mazin For Keto Menu',
          short_name: 'MazinMenu',
          description: 'Mazin Restaurant Menu - Keto & Healthy Food',
          theme_color: '#2c2416',
          background_color: '#faf8f5',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            {
              src: 'mazinlogo.jpeg',
              sizes: '192x192',
              type: 'image/jpeg',
              purpose: 'any maskable'
            },
            {
              src: 'mazinlogo.jpeg',
              sizes: '512x512',
              type: 'image/jpeg',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpeg,jpg}'],
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          navigateFallback: '/index.html',
          // Add network-first caching for Firestore endpoints and navigation fallback
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'unsplash-images',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Cache Google Fonts
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Cache Google Fonts Webfonts
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Cache Firebase Storage Images
              urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'firebase-storage-images',
                expiration: {
                  maxEntries: 500,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Network-first for Firestore REST/gRPC endpoints to prefer fresh data but allow fallback
              urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*$/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'firestore-api',
                networkTimeoutSeconds: 10,
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
