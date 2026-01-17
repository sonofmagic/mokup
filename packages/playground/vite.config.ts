import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    tailwindcss(),
  ],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/routes': {
        target: 'http://localhost:5173',
        changeOrigin: true,
        rewrite: () => '/_mokup/routes',
      },
      '/api': {
        target: 'http://localhost:5173',
        changeOrigin: true,
      },
      '/api-extra': {
        target: 'http://localhost:5173',
        changeOrigin: true,
      },
      '/api-ignored': {
        target: 'http://localhost:5173',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/playground.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
