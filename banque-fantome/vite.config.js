import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// En local (npm run dev / vite preview), une adresse sans le préfixe exact « /banque-fantome/ »
// (barre finale oubliée, ou /admin tapé à la racine) affichait une page d'erreur de Vite.
// GitHub Pages corrige ça tout seul en ligne ; ici on redirige vers la bonne adresse.
const BASE = '/banque-fantome/'
function redirigerVersBase() {
  const corriger = (req, res, next) => {
    const [chemin, requete = ''] = req.url.split('?')
    if (chemin.startsWith(BASE) || chemin.startsWith('/@') || chemin.startsWith('/node_modules/') || chemin === '/') return next()
    const cible = chemin === BASE.slice(0, -1) ? BASE : BASE + chemin.replace(/^\/+/, '')
    res.statusCode = 302
    res.setHeader('Location', cible + (requete ? `?${requete}` : ''))
    res.end()
  }
  return {
    name: 'bf-rediriger-vers-base',
    configureServer: server => { server.middlewares.use(corriger) },
    configurePreviewServer: server => { server.middlewares.use(corriger) },
  }
}

export default defineConfig({
  plugins: [
    redirigerVersBase(),
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
        // Les photos du fil d'actu se chargent à l'affichage, pas toutes d'avance à l'installation
        globIgnores: ['**/images/actu/**'],
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
