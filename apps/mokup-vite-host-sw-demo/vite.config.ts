import process from 'node:process'
import vue from '@vitejs/plugin-vue'
import mokup from 'mokup/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { getMokupViteAliases } from '../../scripts/mokup-alias.mjs'

const isE2E = process.env.E2E === '1'

export default defineConfig({
  optimizeDeps: isE2E ? { noDiscovery: true, entries: [] } : undefined,
  resolve: {
    alias: getMokupViteAliases(),
  },
  plugins: [
    vue(),
    mokup({
      entries: {
        dir: 'mock',
        prefix: '/api',
        mode: 'sw',
        sw: {
          register: false,
        },
      },
    }),
    VitePWA({
      strategies: 'generateSW',
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      filename: 'sw.js',
      devOptions: {
        enabled: true,
      },
      workbox: {
        importScripts: ['mokup-sw-bridge.js'],
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
