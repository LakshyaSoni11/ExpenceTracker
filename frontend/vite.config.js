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
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('socket.io-client') || id.includes('socket.io')) return 'socket';
          if (id.includes('html2canvas') || id.includes('jspdf') || id.includes('canvg')) return 'report';
          if (id.includes('react-router') || id.includes('react-dom') || id.includes('react')) return 'react-vendor';
          if (id.includes('lucide-react')) return 'icons';
          return 'vendor';
        },
      },
    },
  },
})