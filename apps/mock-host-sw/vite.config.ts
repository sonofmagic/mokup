import mokup from 'mokup/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { getMokupViteAliases } from '../../scripts/mokup-alias.mjs'

export default defineConfig({
  resolve: {
    alias: getMokupViteAliases(),
  },
  plugins: [
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
