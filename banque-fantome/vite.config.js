import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // PWA : manifeste + service worker (cache de l'appli pour installation sur téléphone)
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'images/**/*'],
      manifest: {
        id: '/banque-fantome/',
        name: 'Banque Fantôme',
        short_name: 'Banque Fantôme',
        description: 'Institution de circulation : ouvrez un compte, fabriquez votre monnaie, échangez objets, œuvres et services.',
        lang: 'fr',
        start_url: '/banque-fantome/',
        scope: '/banque-fantome/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#F5E27A',
        background_color: '#FFFDF7',
        categories: ['art', 'social'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Market', url: '/banque-fantome/market', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Déposer', url: '/banque-fantome/deposer', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
          { name: "S'enrichir", url: '/banque-fantome/senrichir', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        // L'appli (HTML/JS/CSS/polices/icônes) est mise en cache à l'installation.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Toute route de l'appli renvoie index.html (même hors ligne).
        navigateFallback: '/banque-fantome/index.html',
        navigateFallbackDenylist: [/^\/(?!banque-fantome)/],
        runtimeCaching: [
          {
            // Polices Google : cache longue durée
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'polices', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } },
          },
          {
            // Images des objets (Supabase Storage) : réseau d'abord, cache en secours
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'images-objets', expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
          {
            // Données (objets, messages…) : jamais mises en cache, toujours le réseau
            urlPattern: /^https:\/\/.*\.supabase\.co\/(rest|auth|functions|realtime)\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  base: '/banque-fantome/',
})
