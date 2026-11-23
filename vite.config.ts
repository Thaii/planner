import path from 'node:path'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Relative base so the build works at any GitHub Pages path (e.g. /planner/).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icons/*/*', 'manifest-*.webmanifest'],
      manifest: {
        name: 'Life Planner', short_name: 'Planner', id: './', description: 'A private daily planner that lives on your device.',
        start_url: './', scope: './', display: 'standalone', background_color: '#FBE4EB', theme_color: '#FBE4EB',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        navigateFallback: 'index.html',
        runtimeCaching: [{ urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/, handler: 'StaleWhileRevalidate', options: { cacheName: 'fonts', expiration: { maxEntries: 20 } } }],
      },
    })],
  define: { __BUILD__: JSON.stringify(new Date().toISOString()) },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
