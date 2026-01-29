import vue from '@vitejs/plugin-vue'
import mokup from 'mokup/vite'
import { defineConfig } from 'vite'
import { getMokupViteAliases } from '../../scripts/mokup-alias.mjs'

export default defineConfig({
  resolve: {
    alias: getMokupViteAliases(),
  },
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
