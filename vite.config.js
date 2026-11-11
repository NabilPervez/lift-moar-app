import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'favicon-32.png', 'favicon-16.png', 'apple-touch-icon.png', 'og-image.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,mp3}'],
        navigateFallback: '/index.html',
        // Static pages that must not be swapped for the app shell
        navigateFallbackDenylist: [/^\/privacy/],
        cleanupOutdatedCaches: true,
        // fonts are self-hosted (2026-11-11) — no runtime caching needed
      },
      manifest: {
        name: 'Lift More: Track & Visualize',
        short_name: 'Lift More',
        description:
          'Plan your training week, run guided sessions with a rest timer, and track lift progression — all stored on your device.',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f7f8fc',
        theme_color: '#f7f8fc',
        categories: ['health', 'fitness', 'lifestyle'],
        shortcuts: [
          { name: "Today's workout", short_name: 'Today', url: '/?view=schedule', icons: [{ src: 'pwa-192.png', sizes: '192x192' }] },
          { name: 'Progress', short_name: 'Progress', url: '/?view=dashboard', icons: [{ src: 'pwa-192.png', sizes: '192x192' }] },
        ],
        screenshots: [
          { src: 'screenshot-1.png', sizes: '1080x1920', type: 'image/png', form_factor: 'narrow', label: 'Workout complete' },
          { src: 'screenshot-wide.png', sizes: '1920x1080', type: 'image/png', form_factor: 'wide', label: 'Lift More' },
        ],
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
