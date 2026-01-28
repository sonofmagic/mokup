import vue from '@vitejs/plugin-vue'
import mokup from 'mokup/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vue(),
    mokup({
      entries: {
        dir: 'mock',
        prefix: '/api',
        ignorePrefix: ['_'],
      },
    }),
  ],
})
