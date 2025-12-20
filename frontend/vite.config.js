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
})