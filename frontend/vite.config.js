import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path' // 1. Import path

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
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