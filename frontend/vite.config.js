import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path' // 1. Import path

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'ExpenceTracker',
        short_name: 'ExpenceTracker',
        description: 'Track shared expenses, split bills, and settle up with friends, even offline.',
        theme_color: '#10b981',
        background_color: '#f0fdf4',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/expencetracker-6y0c\.onrender\.com\/api\/(health|ai-test).*/,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      // 2. Define the @ symbol to point to the src folder
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2019',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // Heavy lazy-loaded report libraries stay in their own chunk,
          // pulled in only when the export feature is used.
          if (/(html2canvas|jspdf|canvg|dompurify|file-saver|html2canvas-pro)/i.test(id)) return 'report';
          // Everything else third-party shares one vendor chunk to avoid
          // cross-chunk circular imports (which cause TDZ ReferenceErrors).
          return 'vendor';
        },
      },
    },
  },
})